import fp from "fastify-plugin";
import RAPIER from "@dimforge/rapier3d-compat";
import { RoomManager } from "../room/RoomManager.js";
import { Lobby } from "../room/Lobby.js";
import { supabase } from "../supabase.js";
import type { Room } from "../room/Room.js";

export default fp(async (fastify) => {
  // Initialize Rapier WASM before anything else
  await RAPIER.init();
  console.log("[Rapier] WASM initialized");

  const roomManager = new RoomManager(fastify.io);
  const lobby = new Lobby();
  await lobby.loadRecipes();

  /** マッチング成立時にゲームを開始 */
  function startMatchedGame(match: NonNullable<ReturnType<typeof lobby.tryMatch>>): void {
    const roomId = `game-${match.recipeId}-${Date.now()}`;
    const allowedUserIds = match.players.map((p) => p.userId);
    const room = roomManager.getOrCreateRoom(roomId, match.goalItemId, match.recipeId, allowedUserIds);

    // socketId → userId マッピングを登録
    for (const wp of match.players) {
      room.userIds.set(wp.socketId, wp.userId);
    }

    console.log(
      `[Lobby] Match found! Recipe: ${match.recipeName}, Room: ${roomId}, Players: ${match.players.length}`,
    );

    for (const wp of match.players) {
      const socket = fastify.io.sockets.sockets.get(wp.socketId);
      if (!socket) continue;

      const player = room.addPlayer(wp.socketId);
      void socket.join(roomId);

      const pos = player.rigidBody.translation();
      socket.emit("game:start", {
        roomId,
        position: { x: pos.x, y: pos.y, z: pos.z },
        stage: room.stage.serialize(),
        inventory: player.inventory.serialize(),
        recipeName: match.recipeName,
      });
    }
  }

  /** ゴールアイテムを持っているかチェックし、持っていたらゲームクリア処理 */
  async function checkGameClear(room: Room, roomId: string, socketId: string): Promise<void> {
    if (room.cleared) return;

    const player = room.getPlayer(socketId);
    if (!player) return;

    // ゴールアイテムを持っているか
    const goalItem = player.inventory.items.get(room.goalItemId);
    if (!goalItem || goalItem.number <= 0) return;

    room.cleared = true;
    const recipeId = room.recipeId;

    console.log(`[Game] Clear! Room: ${roomId}, Recipe: ${recipeId}, by: ${socketId}`);

    // 全プレイヤーにクリア通知
    fastify.io.to(roomId).emit("game:clear", { recipeName: room.id });

    // Supabaseにクリアデータを保存
    for (const [sid] of room.players) {
      const userId = room.userIds.get(sid);
      if (!userId) continue;

      // 既存レコードを確認
      const { data: existing } = await supabase
        .from("clear_recipe")
        .select("id, amount")
        .eq("user_id", userId)
        .eq("recipe_id", recipeId)
        .single();

      if (existing) {
        // インクリメント
        await supabase
          .from("clear_recipe")
          .update({ amount: existing.amount + 1 })
          .eq("id", existing.id);
      } else {
        // 新規作成
        await supabase
          .from("clear_recipe")
          .insert({ user_id: userId, recipe_id: recipeId, amount: 1 });
      }
    }

    console.log(`[Game] Clear data saved for ${room.players.size} players`);
  }

  fastify.io.on("connection", (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    /** レシピ一覧を取得 */
    socket.on("lobby:recipes", (_, ack?: (res: unknown) => void) => {
      if (ack) {
        ack({ ok: true, recipes: lobby.getRecipes() });
      }
    });

    /** ホスト: レシピを選んで合言葉でロビーを作成 */
    socket.on(
      "lobby:create",
      async (
        data: { accessToken: string; recipeId: number; passphrase: string },
        ack?: (res: unknown) => void,
      ) => {
        const userId = await lobby.authenticateUser(data.accessToken);
        if (!userId) {
          if (ack) ack({ ok: false, message: "Authentication failed" });
          return;
        }

        const materialId = await lobby.getUserMaterial(userId);
        if (materialId === null) {
          if (ack) ack({ ok: false, message: "No material assigned" });
          return;
        }

        const result = lobby.createRoom(
          data.passphrase,
          data.recipeId,
          socket.id,
          userId,
          materialId,
        );

        if (ack) {
          const status = result.ok ? lobby.getRoomStatus(data.passphrase) : null;
          ack({ ...result, materialId, status });
        }
      },
    );

    /** 参加者: 合言葉でロビーに参加 */
    socket.on(
      "lobby:join",
      async (
        data: { accessToken: string; passphrase: string },
        ack?: (res: unknown) => void,
      ) => {
        const userId = await lobby.authenticateUser(data.accessToken);
        if (!userId) {
          if (ack) ack({ ok: false, message: "Authentication failed" });
          return;
        }

        const materialId = await lobby.getUserMaterial(userId);
        if (materialId === null) {
          if (ack) ack({ ok: false, message: "No material assigned" });
          return;
        }

        const result = lobby.joinRoom(data.passphrase, socket.id, userId, materialId);

        if (!result.ok) {
          if (ack) ack(result);
          return;
        }

        const status = lobby.getRoomStatus(data.passphrase);
        if (ack) ack({ ...result, materialId, status });

        // ロビーの状況を同じ合言葉の全員に通知
        if (status) {
          for (const p of status.players) {
            const s = fastify.io.sockets.sockets.get(p.socketId);
            s?.emit("lobby:update", status);
          }
        }

        // マッチング試行
        const match = lobby.tryMatch(data.passphrase);
        if (match) {
          startMatchedGame(match);
        }
      },
    );

    /** ロビーから退出 */
    socket.on("lobby:leave", () => {
      const passphrase = lobby.getPlayerRoom(socket.id);
      lobby.removePlayer(socket.id);
      if (passphrase) {
        const status = lobby.getRoomStatus(passphrase);
        if (status) {
          for (const p of status.players) {
            const s = fastify.io.sockets.sockets.get(p.socketId);
            s?.emit("lobby:update", status);
          }
        }
      }
    });

    /** 既存の room:join（開発・テスト用） */
    socket.on(
      "room:join",
      (data: { roomId: string }, ack?: (res: unknown) => void) => {
        const { roomId } = data;
        const room = roomManager.getOrCreateRoom(roomId);
        const player = room.addPlayer(socket.id);
        void socket.join(roomId);

        const pos = player.rigidBody.translation();
        console.log(`[Socket.IO] ${socket.id} joined room ${roomId}`);

        if (ack) {
          ack({
            ok: true,
            position: { x: pos.x, y: pos.y, z: pos.z },
            stage: room.stage.serialize(),
            inventory: player.inventory.serialize(),
          });
        }

        socket.to(roomId).emit("player:joined", {
          playerId: socket.id,
          position: { x: pos.x, y: pos.y, z: pos.z },
        });
      },
    );

    /** Leave a room */
    socket.on("room:leave", (data: { roomId: string }) => {
      const { roomId } = data;
      const room = roomManager.rooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        void socket.leave(roomId);
        socket.to(roomId).emit("player:left", { playerId: socket.id });

        if (room.playerCount === 0) {
          roomManager.removeRoom(roomId);
        }
      }
    });

    /** Player input */
    socket.on(
      "player:input",
      (data: {
        roomId: string;
        message: { eventName: string; content: Record<string, unknown> };
      }) => {
        const room = roomManager.rooms.get(data.roomId);
        if (!room) return;

        const player = room.getPlayer(socket.id);
        if (!player) return;

        const { eventName, content } = data.message;

        switch (eventName) {
          case "move":
            player.move((content.amount as number) ?? 0);
            break;
          case "rotate":
            player.rotate((content.amount as number) ?? 0);
            break;
          case "joystick":
            player.setInput({
              x: (content.x as number) ?? 0,
              y: (content.y as number) ?? 0,
            });
            break;
          case "set:position":
            player.setPosition(content as unknown as { x: number; y: number; z: number });
            break;
          case "set:rotation":
            player.setRotation(content.angleY as number);
            break;
          case "impulse":
            player.applyImpulse(content as unknown as { x: number; y: number; z: number });
            break;
          case "work": {
            const instanceId = content.instanceId as number;
            const processIndex = content.processIndex as number;
            const worldObject = room.stage.getWorldObject(instanceId);
            if (!worldObject) {
              socket.emit("work:result", { success: false, message: "Object not found" });
              break;
            }
            const wasDestroyed = worldObject.destroyed;
            const prevItems = player.inventory.serialize();
            const result = worldObject.work(player, processIndex, 1);
            socket.emit("work:result", result);
            const newItems = player.inventory.serialize();
            if (JSON.stringify(prevItems) !== JSON.stringify(newItems)) {
              socket.emit("inventory:update", { items: newItems });
            }
            if (!wasDestroyed && worldObject.destroyed) {
              fastify.io.to(data.roomId).emit("worldobject:destroyed", {
                instanceId: worldObject.instanceId,
              });
            }
            const destroyedId = worldObject.processes[processIndex]?.destroyedStageObjectId;
            if (destroyedId !== null && destroyedId !== undefined) {
              fastify.io.to(data.roomId).emit("stage:object:destroyed", {
                objectId: destroyedId,
              });
            }
            // ゴールアイテムチェック
            if (result.success) {
              void checkGameClear(room, data.roomId, socket.id);
            }
            break;
          }
          case "work:cancel":
            player.currentWork = null;
            break;
          case "drop": {
            const dropItemId = content.itemId as number;
            const dropCount = content.count as number;
            if (!dropItemId || !dropCount || dropCount <= 0) break;
            if (!player.inventory.consumeItem(dropItemId, dropCount)) {
              socket.emit("drop:result", { success: false, message: "Not enough items" });
              break;
            }
            const pos = player.rigidBody.translation();
            const droppedObj = room.stage.createDroppedObject(dropItemId, dropCount, {
              x: pos.x,
              y: 0,
              z: pos.z,
            });
            if (droppedObj) {
              const area = room.stage.findNearestArea(pos.x, pos.z);
              fastify.io.to(data.roomId).emit("worldobject:spawned", {
                areaId: area.id,
                worldObject: {
                  instanceId: droppedObj.instanceId,
                  objectId: droppedObj.objectId,
                  position: droppedObj.position,
                  destroyed: false,
                  isDropped: true,
                },
              });
            }
            socket.emit("inventory:update", { items: player.inventory.serialize() });
            socket.emit("drop:result", { success: true, message: "Item dropped" });
            break;
          }
        }
      },
    );

    /** On disconnect, remove from lobby and all rooms */
    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Disconnected: ${socket.id}`);

      // ロビーから削除
      const passphrase = lobby.getPlayerRoom(socket.id);
      if (passphrase) {
        lobby.removePlayer(socket.id);
        const status = lobby.getRoomStatus(passphrase);
        if (status) {
          for (const p of status.players) {
            const s = fastify.io.sockets.sockets.get(p.socketId);
            s?.emit("lobby:update", status);
          }
        }
      }

      // ルームから削除
      for (const [roomId, room] of roomManager.rooms) {
        if (room.players.has(socket.id)) {
          room.removePlayer(socket.id);
          socket.to(roomId).emit("player:left", { playerId: socket.id });
          if (room.playerCount === 0) {
            roomManager.removeRoom(roomId);
          }
        }
      }
    });
  });

  // Start the physics game loop
  roomManager.startLoop();

  fastify.addHook("onClose", async () => {
    roomManager.stopLoop();
  });
});
