import { FurnitureDef } from "../data/types.js";
import { ITEM_DEFS } from "../data/Items/index.js";

export interface RequiredStep {
  /** インタラクト先のWorldObjectのID */
  objectId: number;
  /** そのインタラクトで必要なアイテムID一覧 */
  ingredients: number[];
  /** そのインタラクトで得られるアイテムID */
  produces: number;
}

export class Furniture {
  readonly id: number;
  readonly name: string;
  readonly recipe: number[];
  readonly requiredObjectId: number;

  constructor(def: FurnitureDef) {
    this.id = def.id;
    this.name = def.name;
    this.recipe = def.recipe;
    this.requiredObjectId = def.requiredObjectId;
  }

  /**
   * この家具を作るために必要な全ステップを再帰的に列挙する
   * (素材採取 → 中間クラフト → 最終クラフト の順)
   */
  getAllRequiredSteps(): RequiredStep[] {
    const steps: RequiredStep[] = [];
    const visited = new Set<number>();

    const resolve = (itemId: number): void => {
      if (visited.has(itemId)) return;
      visited.add(itemId);

      const def = ITEM_DEFS.get(itemId);
      if (!def) return;

      // 先に原材料を再帰解決
      for (const ingId of def.ingredients) {
        resolve(ingId);
      }

      steps.push({
        objectId: def.objectId,
        ingredients: def.ingredients,
        produces: def.id,
      });
    };

    // レシピの各アイテムを再帰的に解決
    for (const itemId of this.recipe) {
      resolve(itemId);
    }

    // 最終クラフト (家具自体の組み立て)
    steps.push({
      objectId: this.requiredObjectId,
      ingredients: this.recipe,
      produces: this.id,
    });

    return steps;
  }

  /** 必要な全WorldObjectのIDを重複なしで返す */
  getAllRequiredObjectIds(): number[] {
    const steps = this.getAllRequiredSteps();
    return [...new Set(steps.map((s) => s.objectId))];
  }
}
