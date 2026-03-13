import RAPIER from '@dimforge/rapier3d-compat'
import { Server as SocketIOServer } from 'socket.io'

export interface PhysicsBody {
  playerId: string
  rigidBody: RAPIER.RigidBody
}

export class Room {
  readonly id: string
  readonly world: RAPIER.World
  readonly bodies: Map<string, PhysicsBody> = new Map()

  /** Ground collider included by default */
  constructor(id: string) {
    this.id = id
    // Gravity: -9.81 m/s² on Y axis
    this.world = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })

    // Static ground plane at y=0
    const groundDesc = RAPIER.ColliderDesc.cuboid(50.0, 0.1, 50.0)
    this.world.createCollider(groundDesc)
  }

  /** Spawn a dynamic sphere for the player at a random position above the ground */
  addPlayer(playerId: string): PhysicsBody {
    const x = (Math.random() - 0.5) * 10
    const z = (Math.random() - 0.5) * 10

    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, 5.0, z)
    const rigidBody = this.world.createRigidBody(bodyDesc)

    const colliderDesc = RAPIER.ColliderDesc.ball(0.5).setRestitution(0.5)
    this.world.createCollider(colliderDesc, rigidBody)

    const body: PhysicsBody = { playerId, rigidBody }
    this.bodies.set(playerId, body)
    return body
  }

  removePlayer(playerId: string): void {
    const body = this.bodies.get(playerId)
    if (body) {
      this.world.removeRigidBody(body.rigidBody)
      this.bodies.delete(playerId)
    }
  }

  /** Apply an impulse to a player's body (used for input) */
  applyImpulse(playerId: string, impulse: { x: number; y: number; z: number }): void {
    const body = this.bodies.get(playerId)
    if (body) {
      body.rigidBody.applyImpulse(impulse, true)
    }
  }

  /** Step physics and return serialized state */
  step(): Array<{ playerId: string; position: { x: number; y: number; z: number } }> {
    this.world.step()

    const state: Array<{ playerId: string; position: { x: number; y: number; z: number } }> = []
    for (const [, body] of this.bodies) {
      const pos = body.rigidBody.translation()
      state.push({
        playerId: body.playerId,
        position: { x: pos.x, y: pos.y, z: pos.z },
      })
    }
    return state
  }

  get playerCount(): number {
    return this.bodies.size
  }

  destroy(): void {
    this.world.free()
  }
}

export class RoomManager {
  readonly rooms: Map<string, Room> = new Map()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private readonly io: SocketIOServer
  private readonly tickRate: number

  constructor(io: SocketIOServer, tickRate = 60) {
    this.io = io
    this.tickRate = tickRate
  }

  getOrCreateRoom(roomId: string): Room {
    let room = this.rooms.get(roomId)
    if (!room) {
      room = new Room(roomId)
      this.rooms.set(roomId, room)
      console.log(`[RoomManager] Room created: ${roomId}`)
    }
    return room
  }

  removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.destroy()
      this.rooms.delete(roomId)
      console.log(`[RoomManager] Room destroyed: ${roomId}`)
    }
  }

  /** Start the fixed-step game loop */
  startLoop(): void {
    const intervalMs = 1000 / this.tickRate
    this.intervalId = setInterval(() => {
      for (const [roomId, room] of this.rooms) {
        if (room.playerCount === 0) continue
        const state = room.step()
        this.io.to(roomId).emit('physics:state', { roomId, bodies: state })
      }
    }, intervalMs)
    console.log(`[RoomManager] Game loop started at ${this.tickRate}fps`)
  }

  /** Stop the game loop and clean up all rooms */
  stopLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    for (const [, room] of this.rooms) {
      room.destroy()
    }
    this.rooms.clear()
    console.log('[RoomManager] Game loop stopped, all rooms destroyed')
  }
}
