import { Server as SocketIOServer } from "socket.io";
import { Room } from "./Room.js";

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
