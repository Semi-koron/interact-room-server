import RAPIER from "@dimforge/rapier3d-compat";
import { Stage } from "./Stage.js";
import { Player } from "./Player.js";

export class Room {
  readonly id: string;
  readonly world: RAPIER.World;
  readonly stage: Stage;
  readonly goalItemId: number;
  readonly allowedUserIds: string[] = [];
  readonly players: Map<string, Player> = new Map();

  constructor(id: string, goalItemId: number, allowedUserIds: string[] = []) {
    this.id = id;
    this.goalItemId = goalItemId;
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 });
    this.stage = new Stage(this.world, goalItemId);
    this.allowedUserIds = allowedUserIds;
  }

  addPlayer(playerId: string): Player {
    // if (
    //   this.allowedUserIds.length > 0 &&
    //   !this.allowedUserIds.includes(playerId)
    // ) {
    //   throw new Error("User not allowed in this room");
    // }
    const player = new Player(playerId, this.world);
    this.players.set(playerId, player);
    return player;
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      this.world.removeRigidBody(player.rigidBody);
      this.players.delete(playerId);
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  /** Step physics and return serialized state */
  step(): Array<{
    playerId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
  }> {
    // 各プレイヤーのlastInputに基づいて回転・移動
    for (const [, player] of this.players) {
      player.applyInput();
    }

    this.world.step();

    const state: Array<{
      playerId: string;
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number; w: number };
    }> = [];
    for (const [, player] of this.players) {
      state.push(player.serialize());
    }
    return state;
  }

  get playerCount(): number {
    return this.players.size;
  }

  destroy(): void {
    this.world.free();
  }
}
