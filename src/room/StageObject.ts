import RAPIER from "@dimforge/rapier3d-compat";

export class StageObject {
  readonly id: string;
  readonly rigidBody: RAPIER.RigidBody;
  readonly collider: RAPIER.Collider;
  private readonly world: RAPIER.World;
  private _destroyed = false;

  constructor(
    id: string,
    world: RAPIER.World,
    position: [number, number, number],
    halfExtents: [number, number, number],
  ) {
    this.id = id;
    this.world = world;

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
}
