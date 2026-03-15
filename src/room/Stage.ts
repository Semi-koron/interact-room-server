import RAPIER from "@dimforge/rapier3d-compat";
import { StageObject } from "./StageObject.js";

export class Stage {
  readonly objects: Map<string, StageObject> = new Map();

  constructor(private readonly world: RAPIER.World) {
    // Static ground plane at y=0
    const groundDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0);
    this.world.createCollider(groundDesc);

    // 壁(川)の定義
    const wallDefs: Array<{
      id: string;
      pos: [number, number, number];
      half: [number, number, number];
    }> = [
      // X軸方向の壁
      { id: "wall-x-10", pos: [10, 0, 0], half: [1, 1, 10] },
      { id: "wall-x-30", pos: [30, 0, 0], half: [1, 1, 10] },
      { id: "wall-x--10", pos: [-10, 0, 0], half: [1, 1, 10] },
      { id: "wall-x--30", pos: [-30, 0, 0], half: [1, 1, 10] },
      // Z軸方向の壁
      { id: "wall-z-10", pos: [0, 0, 10], half: [10, 1, 1] },
      { id: "wall-z-30", pos: [0, 0, 30], half: [10, 1, 1] },
      { id: "wall-z--10", pos: [0, 0, -10], half: [10, 1, 1] },
      { id: "wall-z--30", pos: [0, 0, -30], half: [10, 1, 1] },
    ];

    for (const def of wallDefs) {
      this.addObject(def.id, def.pos, def.half);
    }
  }

  addObject(
    id: string,
    position: [number, number, number],
    halfExtents: [number, number, number],
  ): StageObject {
    const obj = new StageObject(id, this.world, position, halfExtents);
    this.objects.set(id, obj);
    return obj;
  }

  getObject(id: string): StageObject | undefined {
    return this.objects.get(id);
  }
}
