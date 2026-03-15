import fp from "fastify-plugin";
import RAPIER from "@dimforge/rapier3d-compat";
import { RoomManager } from "../room/RoomManager.js";

export default fp(async (fastify) => {
  // Initialize Rapier WASM before anything else
  await RAPIER.init();
  console.log("[Rapier] WASM initialized");

  const roomManager = new RoomManager(fastify.io);

  fastify.io.on("connection", (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`);

    /** Join a room – creates it if it doesn't exist yet */
    socket.on(
      "room:join",
      (data: { roomId: string }, ack?: (res: unknown) => void) => {
        const { roomId } = data;
        const room = roomManager.getOrCreateRoom(roomId);
        const player = room.addPlayer(socket.id);
        void socket.join(roomId);

        const pos = player.rigidBody.translation();
        console.log(`[Socket.IO] ${socket.id} joined room ${roomId}`);

        // Acknowledge with spawn position + stage data
        if (ack) {
          ack({
            ok: true,
            position: { x: pos.x, y: pos.y, z: pos.z },
            stage: room.stage.serialize(),
          });
        }

        // Notify others
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

        // Auto-cleanup empty rooms
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
        }
      },
    );

    /** On disconnect, remove from all rooms */
    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Disconnected: ${socket.id}`);
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
