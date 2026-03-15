import { Player } from "./Player.js";
import { Process } from "./Process.js";

export class WorldObject {
  readonly id: string;
  readonly reach: number;
  readonly position: { x: number; y: number; z: number };
  readonly processes: Process[];

  constructor(
    id: string,
    reach: number,
    position: { x: number; y: number; z: number },
    processes: Process[],
  ) {
    this.id = id;
    this.reach = reach;
    this.position = position;
    this.processes = processes;
  }

  isReachable(player: Player): boolean {
    const playerPos = player.rigidBody.translation();
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    return distanceSquared <= this.reach * this.reach;
  }

  interact(
    player: Player,
    processIndex: number,
  ): { success: boolean; message: string } {
    if (!this.isReachable(player)) {
      return { success: false, message: "Object is out of reach" };
    }
    if (!player.inventory.hasItems(this.processes[processIndex].consumeItems)) {
      return { success: false, message: "Not enough items" };
    }
    this.processes[processIndex].execute(player);
    return { success: true, message: "Interaction successful" };
  }
}
