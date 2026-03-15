import { Item } from "./Item.js";
import { Player } from "./Player.js";
import { StageObject } from "./StageObject.js";

export class Process {
  readonly consumeItems: Item[];
  readonly getItems: Item[];
  private readonly stageObject: StageObject | null;

  constructor(
    consumeItems: Item[],
    getItems: Item[],
    stageObject: StageObject | null = null,
  ) {
    this.consumeItems = consumeItems;
    this.getItems = getItems;
    this.stageObject = stageObject;
  }

  execute(player: Player): { success: boolean; message: string } {
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
