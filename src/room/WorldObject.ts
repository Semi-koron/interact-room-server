import { Player } from "./Player.js";
import { Process } from "./Process.js";

let nextInstanceId = 1;

export class WorldObject {
  /** インスタンスごとのユニークID */
  readonly instanceId: number;
  /** マスターデータのオブジェクトID */
  readonly objectId: number;
  readonly reach: number;
  readonly position: { x: number; y: number; z: number };
  readonly processes: Process[];
  private _destroyed = false;

  constructor(
    objectId: number,
    reach: number,
    position: { x: number; y: number; z: number },
    processes: Process[],
  ) {
    this.instanceId = nextInstanceId++;
    this.objectId = objectId;
    this.reach = reach;
    this.position = position;
    this.processes = processes;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  isReachable(player: Player): boolean {
    const playerPos = player.rigidBody.translation();
    const dx = playerPos.x - this.position.x;
    const dy = playerPos.y - this.position.y;
    const dz = playerPos.z - this.position.z;
    const distanceSquared = dx * dx + dy * dy + dz * dz;
    return distanceSquared <= this.reach * this.reach;
  }

  /**
   * 毎tick呼ばれる作業メソッド。進捗を加算し、workloadに達したらexecute。
   * 別のobject/processに切り替わった場合は進捗リセット。
   */
  work(
    player: Player,
    processIndex: number,
    deltaTime: number,
  ): { success: boolean; message: string } {
    if (this._destroyed) {
      player.currentWork = null;
      return { success: false, message: "Object is destroyed" };
    }
    if (!this.isReachable(player)) {
      player.currentWork = null;
      return { success: false, message: "Object is out of reach" };
    }
    const process = this.processes[processIndex];
    if (!process) {
      player.currentWork = null;
      return { success: false, message: "Invalid process index" };
    }
    if (!player.inventory.hasItems(process.requireItems)) {
      player.currentWork = null;
      return { success: false, message: "Required tool not found" };
    }
    if (!player.inventory.hasItems(process.consumeItems)) {
      player.currentWork = null;
      return { success: false, message: "Not enough items" };
    }

    // 対象が変わったら進捗リセット
    const work = player.currentWork;
    if (
      !work ||
      work.instanceId !== this.instanceId ||
      work.processIndex !== processIndex
    ) {
      player.currentWork = { instanceId: this.instanceId, processIndex, progress: 0 };
    }

    player.currentWork!.progress += deltaTime;

    if (player.currentWork!.progress >= process.workload) {
      player.currentWork = null;
      const result = process.execute(player);
      // StageObject破壊を伴うProcessならWorldObjectも使用済みにする
      if (result.success && process.destroysStageObject) {
        this._destroyed = true;
      }
      return result;
    }

    return { success: true, message: "Working..." };
  }
}
