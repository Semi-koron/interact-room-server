import RAPIER from "@dimforge/rapier3d-compat";
import { Inventory } from "./Inventory.js";

/** ジョイスティック入力状態 (x: 左右 -1〜1, y: 前後 -1〜1) */
export interface StickInput {
  x: number;
  y: number;
}

export class Player {
  readonly playerId: string;
  readonly rigidBody: RAPIER.RigidBody;
  readonly inventory: Inventory = new Inventory();
  lastInput: StickInput = { x: 0, y: 0 };

  private static readonly MAX_ROTATE_SPEED = Math.PI / 120; // 最大10度/tick
  private static readonly MAX_MOVE_SPEED = 0.1; // 最大移動量/tick

  constructor(playerId: string, world: RAPIER.World) {
    this.playerId = playerId;

    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 10;

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(x, 5.0, z)
      .enabledRotations(false, true, false); // Y軸のみ回転可
    this.rigidBody = world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 1, 0.5);
    world.createCollider(colliderDesc, this.rigidBody);
  }

  /** Set the player's Y-axis rotation (radians) */
  setRotation(angleY: number): void {
    const halfAngle = angleY / 2;
    this.rigidBody.setRotation(
      { x: 0, y: Math.sin(halfAngle), z: 0, w: Math.cos(halfAngle) },
      true,
    );
  }

  /** 現在の向きから回転する (amount: -1〜1, 正=左回転, 負=右回転) */
  rotate(amount: number): void {
    const delta = amount * Player.MAX_ROTATE_SPEED;
    const rot = this.rigidBody.rotation();
    const currentAngleY = 2 * Math.atan2(rot.y, rot.w);
    this.setRotation(currentAngleY + delta);
  }

  /** プレイヤーの位置を直接設定する */
  setPosition(position: { x: number; y: number; z: number }): void {
    this.rigidBody.setTranslation(position, true);
  }

  /** 現在の向きに対して前進/後退する (amount: -1〜1, 正=前進, 負=後退) */
  move(amount: number): void {
    const rot = this.rigidBody.rotation();
    const angleY = 2 * Math.atan2(rot.y, rot.w);

    // 向いている方向の前方ベクトル (-Z方向が前)
    const forwardX = -Math.sin(angleY);
    const forwardZ = -Math.cos(angleY);

    const step = amount * Player.MAX_MOVE_SPEED;
    const pos = this.rigidBody.translation();
    this.rigidBody.setTranslation(
      { x: pos.x + forwardX * step, y: pos.y, z: pos.z + forwardZ * step },
      true,
    );
  }

  /** ジョイスティックの入力状態を更新する */
  setInput(input: StickInput): void {
    this.lastInput = input;
  }

  /** Apply an impulse to the body */
  applyImpulse(impulse: { x: number; y: number; z: number }): void {
    this.rigidBody.applyImpulse(impulse, true);
  }

  /** lastInputに基づいて回転・移動を適用する */
  applyInput(): void {
    const { x, y } = this.lastInput;
    // x: 正=右回転, 負=左回転 → rotateは正=左なので符号反転
    if (x !== 0) this.rotate(-x);
    // y: 正=前進, 負=後退
    if (y !== 0) this.move(y);
  }

  /** シリアライズ用の位置・回転を返す */
  serialize(): {
    playerId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
  } {
    const pos = this.rigidBody.translation();
    const rot = this.rigidBody.rotation();
    return {
      playerId: this.playerId,
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: rot.x, y: rot.y, z: rot.z, w: rot.w },
    };
  }

}
