import { Item } from "./Item.js";
import { Player } from "./Player.js";
import { StageObject } from "./StageObject.js";

export class Process {
  readonly consumeItems: Item[];
  readonly requireItems: Item[];
  readonly getItems: Item[];
  private readonly stageObject: StageObject | null;
  readonly workload: number;

  constructor(
    consumeItems: Item[],
    getItems: Item[],
    stageObject: StageObject | null = null,
    workload: number,
    requireItems: Item[] = [],
  ) {
    this.consumeItems = consumeItems;
    this.getItems = getItems;
    this.stageObject = stageObject;
    this.requireItems = requireItems;
    this.workload = workload;
  }

  execute(player: Player): { success: boolean; message: string } {
    if (!player.inventory.hasItems(this.requireItems)) {
      return { success: false, message: "Required tool not found" };
    }
    if (!player.inventory.hasItems(this.consumeItems)) {
      return { success: false, message: "Not enough items" };
    }
    player.inventory.transformItems(this.consumeItems, this.getItems);

    // StageObjectが紐づいている場合、コライダーを破壊する
    if (this.stageObject && !this.stageObject.destroyed) {
      this.stageObject.destroy();
    }

    return { success: true, message: "Process executed successfully" };
  }
}
