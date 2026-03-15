import RAPIER from "@dimforge/rapier3d-compat";

export interface StageObjectData {
  id: number;
  position: [number, number, number];
  halfExtents: [number, number, number];
  destroyed: boolean;
}

export class StageObject {
  readonly id: number;
  readonly position: [number, number, number];
  readonly halfExtents: [number, number, number];
  readonly rigidBody: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly world: RAPIER.World;
  private _destroyed = false;

  constructor(
    id: number,
    world: RAPIER.World,
    position: [number, number, number],
    halfExtents: [number, number, number],
  ) {
    this.id = id;
    this.world = world;
    this.position = position;
    this.halfExtents = halfExtents;

    this.rigidBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed().setTranslation(...position),
    );
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(...halfExtents),
      this.rigidBody,
    );
  }

  /** コライダーを破壊する（橋をかける等） */
  destroy(): void {
    if (this._destroyed) return;
    this.world.removeRigidBody(this.rigidBody);
    this._destroyed = true;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  serialize(): StageObjectData {
    return {
      id: this.id,
      position: this.position,
      halfExtents: this.halfExtents,
      destroyed: this._destroyed,
    };
  }
}
