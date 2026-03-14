import RAPIER from "@dimforge/rapier3d-compat";
import { Server as SocketIOServer } from "socket.io";

/** ジョイスティック入力状態 (x: 左右 -1〜1, y: 前後 -1〜1) */
export interface StickInput {
  x: number;
  y: number;
}

export interface PhysicsBody {
  playerId: string;
  rigidBody: RAPIER.RigidBody;
  lastInput: StickInput;
}

export class Room {
  readonly id: string;
  readonly world: RAPIER.World;
  readonly bodies: Map<string, PhysicsBody> = new Map();

  /** Ground collider included by default */
  constructor(id: string) {
    this.id = id;
    // Gravity: -9.81 m/s² on Y axis
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });

    // Static ground plane at y=0
    const groundDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
    this.world.createCollider(groundDesc);
  }

  /** Spawn a dynamic sphere for the player at a random position above the ground */
  addPlayer(playerId: string): PhysicsBody {
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, 5.0, z)
      .enabledRotations(false, true, false); // Y軸のみ回転可
    const rigidBody = this.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1, 0.5);
    this.world.createCollider(colliderDesc, rigidBody);

    const body: PhysicsBody = {
      playerId,
      rigidBody,
      lastInput: { x: 0, y: 0 },
    };
    this.bodies.set(playerId, body);
    return body;
  }

  removePlayer(playerId: string): void {
    const body = this.bodies.get(playerId);
    if (body) {
      this.world.removeRigidBody(body.rigidBody);
      this.bodies.delete(playerId);
    }
  }

  /** Set the player's Y-axis rotation (radians) */
  setRotation(playerId: string, angleY: number): void {
    const body = this.bodies.get(playerId);
    if (body) {
      // Y軸回転 → クォータニオン変換
      const halfAngle = angleY / 2;
      body.rigidBody.setRotation(
        { x: 0, y: Math.sin(halfAngle), z: 0, w: Math.cos(halfAngle) },
        true,
      );
    }
  }

  /** 現在の向きから回転する (amount: -1〜1, 正=左回転, 負=右回転) */
  rotate(playerId: string, amount: number): void {
    const body = this.bodies.get(playerId);
    if (!body) return;

    const MAX_ROTATE_SPEED = Math.PI / 120; // 最大10度/tick
    const delta = amount * MAX_ROTATE_SPEED;

    const rot = body.rigidBody.rotation();
    const currentAngleY = 2 * Math.atan2(rot.y, rot.w);

    this.setRotation(playerId, currentAngleY + delta);
  }

  /** プレイヤーの位置を直接設定する */
  setPosition(
    playerId: string,
    position: { x: number; y: number; z: number },
  ): void {
    const body = this.bodies.get(playerId);
    if (body) {
      body.rigidBody.setTranslation(position, true);
    }
  }

  /** 現在の向きに対して前進/後退する (amount: -1〜1, 正=前進, 負=後退) */
  move(playerId: string, amount: number): void {
    const body = this.bodies.get(playerId);
    if (!body) return;

    const MAX_MOVE_SPEED = 0.1; // 最大移動量/tick

    const rot = body.rigidBody.rotation();
    const angleY = 2 * Math.atan2(rot.y, rot.w);

    // 向いている方向の前方ベクトル (-Z方向が前)
    const forwardX = -Math.sin(angleY);
    const forwardZ = -Math.cos(angleY);

    const step = amount * MAX_MOVE_SPEED;
    const pos = body.rigidBody.translation();
    body.rigidBody.setTranslation(
      { x: pos.x + forwardX * step, y: pos.y, z: pos.z + forwardZ * step },
      true,
    );
  }

  /** ジョイスティックの入力状態を更新する (lastInputを上書きするだけ) */
  setInput(playerId: string, input: StickInput): void {
    const body = this.bodies.get(playerId);
    if (body) {
      body.lastInput = input;
    }
  }

  /** Apply an impulse to a player's body (used for input) */
  applyImpulse(
    playerId: string,
    impulse: { x: number; y: number; z: number },
  ): void {
    const body = this.bodies.get(playerId);
    if (body) {
      body.rigidBody.applyImpulse(impulse, true);
    }
  }

  /** Step physics and return serialized state */
  step(): Array<{
    playerId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
  }> {
    // 各プレイヤーのlastInputに基づいて回転・移動
    for (const [, body] of this.bodies) {
      const { x, y } = body.lastInput;
      // x: 正=右回転, 負=左回転 → rotateは正=左なので符号反転
      if (x !== 0) this.rotate(body.playerId, -x);
      // y: 正=前進, 負=後退
      if (y !== 0) this.move(body.playerId, y);
    }

    this.world.step();

    const state: Array<{
      playerId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    }> = [];
    for (const [, body] of this.bodies) {
      const pos = body.rigidBody.translation();
      const rot = body.rigidBody.rotation();
      state.push({
        playerId: body.playerId,
        position: { x: pos.x, y: pos.y, z: pos.z },
        rotation: { x: rot.x, y: rot.y, z: rot.z, w: rot.w },
      });
    }
    return state;
  }

  get playerCount(): number {
    return this.bodies.size;
  }

  destroy(): void {
    this.world.free();
  }
}

export class RoomManager {
  readonly rooms: Map<string, Room> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly io: SocketIOServer;
  private readonly tickRate: number;

  constructor(io: SocketIOServer, tickRate = 60) {
    this.io = io;
    this.tickRate = tickRate;
  }

  getOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Room(roomId);
      this.rooms.set(roomId, room);
      console.log(`[RoomManager] Room created: ${roomId}`);
    }
    return room;
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.destroy();
      this.rooms.delete(roomId);
      console.log(`[RoomManager] Room destroyed: ${roomId}`);
    }
  }

  /** Start the fixed-step game loop */
  startLoop(): void {
    const intervalMs = 1000 / this.tickRate;
    this.intervalId = setInterval(() => {
      for (const [roomId, room] of this.rooms) {
        if (room.playerCount === 0) continue;
        const state = room.step();
        this.io.to(roomId).emit("physics:state", { roomId, bodies: state });
      }
    }, intervalMs);
    console.log(`[RoomManager] Game loop started at ${this.tickRate}fps`);
  }

  /** Stop the game loop and clean up all rooms */
  stopLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    for (const [, room] of this.rooms) {
      room.destroy();
    }
    this.rooms.clear();
    console.log("[RoomManager] Game loop stopped, all rooms destroyed");
  }
}
