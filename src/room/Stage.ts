import RAPIER from "@dimforge/rapier3d-compat";
import { Area, AreaData } from "./Area.js";
import { StageObject, StageObjectData } from "./StageObject.js";
import { WorldObject } from "./WorldObject.js";
import { Process } from "./Process.js";
import { Item } from "./Item.js";
import { ITEM_DEFS } from "../data/Items/index.js";
import { OBJECT_DEFS } from "../data/Object/index.js";
import { ProcessDef } from "../data/types.js";

export interface StageData {
  areas: AreaData[];
  objects: StageObjectData[];
}

const GRID_SIZE = 3; // 3x3
const AREA_SIZE = 20; // 各エリア20x20
const WALL_HEIGHT = 1; // 壁の高さ(half)
const WALL_THICKNESS = 1; // 壁の厚み(half)

/** 常に真ん中に配置するobjectId */
const CENTER_OBJECT_IDS = new Set([101, 201]);

/** グリッド交差点の座標 (0〜GRID_SIZE の整数) */
interface GridNode {
  col: number;
  row: number;
}

function nodeKey(n: GridNode): string {
  return `${n.col},${n.row}`;
}

/** 2つのノード間のエッジを表すキー (順序不問) */
function edgeKey(a: GridNode, b: GridNode): string {
  const [k1, k2] = [nodeKey(a), nodeKey(b)].sort();
  return `${k1}-${k2}`;
}

export class Stage {
  readonly areas: Area[] = [];
  readonly objects: Map<number, StageObject> = new Map();
  private nextObjectId = 1000; // 川用のID帯

  constructor(private readonly world: RAPIER.World, goalItemId: number) {
    // 地面 (60x60 全体)
    const totalSize = GRID_SIZE * AREA_SIZE;
    const groundDesc = RAPIER.ColliderDesc.cuboid(totalSize / 2, 0.1, totalSize / 2);
    this.world.createCollider(groundDesc);

    // 3x3 エリア生成
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        this.areas.push(new Area(col, row, AREA_SIZE));
      }
    }

    // 川をランダムに生成
    this.generateRiver();

    // ゴールItemから必要なWorldObjectを配置
    this.placeWorldObjects(goalItemId);
  }

  /**
   * 外周辺上(角を除く)の2点をランダムに選び、
   * グリッド境界グラフ上でランダムウォークして川を生成する
   */
  private generateRiver(): void {
    // 外周の辺上にあるノード (角を除く)
    const edgeNodes: GridNode[] = [];
    for (let i = 1; i < GRID_SIZE; i++) {
      edgeNodes.push({ col: i, row: 0 });           // 上辺
      edgeNodes.push({ col: i, row: GRID_SIZE });    // 下辺
      edgeNodes.push({ col: 0, row: i });            // 左辺
      edgeNodes.push({ col: GRID_SIZE, row: i });    // 右辺
    }

    // 開始点と終了点をランダムに選ぶ (異なる辺から)
    const shuffled = edgeNodes.sort(() => Math.random() - 0.5);
    const start = shuffled[0];
    // 同じ辺にならないように終了点を選ぶ
    const end = shuffled.find((n) => !this.onSameEdge(start, n)) ?? shuffled[1];

    // ランダムウォークでパスを探索
    const path = this.findRandomPath(start, end);

    // パスの各エッジを川(StageObject)として配置
    const halfTotal = (GRID_SIZE * AREA_SIZE) / 2; // 30
    const wallHalfLength = AREA_SIZE / 2; // 10

    const placedEdges = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const ek = edgeKey(a, b);
      if (placedEdges.has(ek)) continue;
      placedEdges.add(ek);

      // ノード座標 → ワールド座標
      const ax = a.col * AREA_SIZE - halfTotal;
      const az = a.row * AREA_SIZE - halfTotal;
      const bx = b.col * AREA_SIZE - halfTotal;
      const bz = b.row * AREA_SIZE - halfTotal;

      // 中点が壁の位置
      const cx = (ax + bx) / 2;
      const cz = (az + bz) / 2;

      const id = this.nextObjectId++;
      if (a.row === b.row) {
        // 横方向のエッジ → X方向に伸びる壁
        this.addObject(id, [cx, 0, cz], [wallHalfLength, WALL_HEIGHT, WALL_THICKNESS]);
      } else {
        // 縦方向のエッジ → Z方向に伸びる壁
        this.addObject(id, [cx, 0, cz], [WALL_THICKNESS, WALL_HEIGHT, wallHalfLength]);
      }
    }
  }

  /** 2つのノードが全体の同じ辺上にあるか */
  private onSameEdge(a: GridNode, b: GridNode): boolean {
    if (a.row === 0 && b.row === 0) return true;
    if (a.row === GRID_SIZE && b.row === GRID_SIZE) return true;
    if (a.col === 0 && b.col === 0) return true;
    if (a.col === GRID_SIZE && b.col === GRID_SIZE) return true;
    return false;
  }

  /**
   * グリッド境界グラフ上でstartからendへのランダムなパスを見つける
   * DFSベースのランダムウォーク
   */
  private findRandomPath(start: GridNode, end: GridNode): GridNode[] {
    const endKey = nodeKey(end);
    const visited = new Set<string>();

    const dfs = (current: GridNode, path: GridNode[]): GridNode[] | null => {
      const ck = nodeKey(current);
      if (ck === endKey) return path;
      visited.add(ck);

      // 隣接ノード (グリッド内部の境界線上のみ)
      const neighbors = this.getNeighbors(current);
      // ランダムシャッフル
      neighbors.sort(() => Math.random() - 0.5);

      for (const next of neighbors) {
        if (visited.has(nodeKey(next))) continue;
        const result = dfs(next, [...path, next]);
        if (result) return result;
      }

      visited.delete(ck); // バックトラック
      return null;
    };

    return dfs(start, [start]) ?? [start, end];
  }

  /** あるノードの隣接ノード (グリッド交差点として有効な範囲) */
  private getNeighbors(node: GridNode): GridNode[] {
    const dirs = [
      { col: 1, row: 0 },
      { col: -1, row: 0 },
      { col: 0, row: 1 },
      { col: 0, row: -1 },
    ];
    const result: GridNode[] = [];
    for (const d of dirs) {
      const nc = node.col + d.col;
      const nr = node.row + d.row;
      if (nc >= 0 && nc <= GRID_SIZE && nr >= 0 && nr <= GRID_SIZE) {
        result.push({ col: nc, row: nr });
      }
    }
    return result;
  }

  addObject(
    id: number,
    position: [number, number, number],
    halfExtents: [number, number, number],
  ): StageObject {
    const obj = new StageObject(id, this.world, position, halfExtents);
    this.objects.set(id, obj);
    return obj;
  }

  getObject(id: number): StageObject | undefined {
    return this.objects.get(id);
  }

  /** 全AreaからWorldObjectをIDで検索 */
  getWorldObject(id: number): WorldObject | undefined {
    for (const area of this.areas) {
      const obj = area.worldObjects.find((o) => o.id === id);
      if (obj) return obj;
    }
    return undefined;
  }

  /** 真ん中のArea (1,1) を返す */
  getCenterArea(): Area {
    return this.areas.find((a) => a.col === 1 && a.row === 1)!;
  }

  /** 真ん中以外のAreaを返す */
  getOuterAreas(): Area[] {
    return this.areas.filter((a) => !(a.col === 1 && a.row === 1));
  }

  /**
   * ゴールItemIdから必要な全objectIdを再帰的に列挙し、
   * WorldObjectを生成してAreaに配置する
   */
  private placeWorldObjects(goalItemId: number): void {
    const requiredObjectIds = this.resolveRequiredObjectIds(goalItemId);

    // 真ん中 / それ以外に分類
    const centerIds = requiredObjectIds.filter((id) => CENTER_OBJECT_IDS.has(id));
    const outerIds = requiredObjectIds.filter((id) => !CENTER_OBJECT_IDS.has(id));

    const centerArea = this.getCenterArea();
    const outerAreas = this.getOuterAreas().sort(() => Math.random() - 0.5);

    // 真ん中に配置
    for (const objId of centerIds) {
      const wo = this.createWorldObject(objId, centerArea);
      if (wo) centerArea.addWorldObject(wo);
    }

    // 外側に1つずつ別々のAreaに配置
    for (let i = 0; i < outerIds.length; i++) {
      const area = outerAreas[i % outerAreas.length];
      const wo = this.createWorldObject(outerIds[i], area);
      if (wo) area.addWorldObject(wo);
    }
  }

  /** ItemIdから必要な全objectIdを再帰的に列挙 (重複なし) */
  private resolveRequiredObjectIds(itemId: number): number[] {
    const objectIds = new Set<number>();
    const visited = new Set<number>();

    const resolve = (id: number): void => {
      if (visited.has(id)) return;
      visited.add(id);

      const def = ITEM_DEFS.get(id);
      if (!def) return;

      objectIds.add(def.objectId);

      for (const ingId of def.ingredients) {
        resolve(ingId);
      }
    };

    resolve(itemId);
    return [...objectIds];
  }

  /** ObjectDefからWorldObjectインスタンスを生成 (Areaのcenter付近にランダム配置) */
  private createWorldObject(objectId: number, area: Area): WorldObject | null {
    const def = OBJECT_DEFS.get(objectId);
    if (!def) return null;

    // Area内のランダムな位置 (centerからsize/2の範囲内)
    const offset = area.size / 4;
    const position = {
      x: area.center.x + (Math.random() - 0.5) * offset * 2,
      y: 0,
      z: area.center.z + (Math.random() - 0.5) * offset * 2,
    };

    const processes = def.processes.map((pDef: ProcessDef) =>
      new Process(
        pDef.consumeItemIds.map((id) => this.itemFromId(id)),
        pDef.getItemIds.map((id) => this.itemFromId(id)),
        null,
        pDef.workload,
        pDef.requireItemIds.map((id) => this.itemFromId(id)),
      ),
    );

    return new WorldObject(objectId, def.reach, position, processes);
  }

  /** ItemIdからItemインスタンスを生成 (数量1) */
  private itemFromId(itemId: number): Item {
    const def = ITEM_DEFS.get(itemId);
    return new Item(itemId, def?.name ?? "Unknown", 1);
  }

  /** フロントエンド送信用にステージ全体をシリアライズ */
  serialize(): StageData {
    return {
      areas: this.areas.map((a) => a.serialize()),
      objects: Array.from(this.objects.values()).map((o) => o.serialize()),
    };
  }
}
