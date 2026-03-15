import { WorldObject } from "./WorldObject.js";

export interface AreaData {
  id: string;
  col: number;
  row: number;
  center: { x: number; y: number; z: number };
  size: number;
  worldObjects: { instanceId: number; objectId: number; position: { x: number; y: number; z: number }; destroyed: boolean }[];
}

export class Area {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly center: { x: number; y: number; z: number };
  readonly size: number;
  readonly worldObjects: WorldObject[] = [];

  constructor(col: number, row: number, size: number) {
    this.col = col;
    this.row = row;
    this.size = size;
    this.id = `area-${col}-${row}`;
    this.center = {
      x: col * size - size,
      y: 0,
      z: row * size - size,
    };
  }

  addWorldObject(obj: WorldObject): void {
    this.worldObjects.push(obj);
  }

  serialize(): AreaData {
    return {
      id: this.id,
      col: this.col,
      row: this.row,
      center: this.center,
      size: this.size,
      worldObjects: this.worldObjects.map((o) => ({
        instanceId: o.instanceId,
        objectId: o.objectId,
        position: o.position,
        destroyed: o.destroyed,
      })),
    };
  }
}
