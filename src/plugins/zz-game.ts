import fp from 'fastify-plugin'
import RAPIER from '@dimforge/rapier3d-compat'
import { RoomManager } from '../room/RoomManager'

export default fp(async (fastify) => {
  // Initialize Rapier WASM before anything else
  await RAPIER.init()
  console.log('[Rapier] WASM initialized')

  const roomManager = new RoomManager(fastify.io)

  fastify.io.on('connection', (socket) => {
    console.log(`[Socket.IO] Connected: ${socket.id}`)

    /** Join a room – creates it if it doesn't exist yet */
    socket.on('room:join', (data: { roomId: string }, ack?: (res: unknown) => void) => {
      const { roomId } = data
      const room = roomManager.getOrCreateRoom(roomId)
      const body = room.addPlayer(socket.id)
      void socket.join(roomId)

      const pos = body.rigidBody.translation()
      console.log(`[Socket.IO] ${socket.id} joined room ${roomId}`)

      // Acknowledge with spawn position
      if (ack) {
        ack({ ok: true, position: { x: pos.x, y: pos.y, z: pos.z } })
      }

      // Notify others
      socket.to(roomId).emit('player:joined', {
        playerId: socket.id,
        position: { x: pos.x, y: pos.y, z: pos.z },
      })
    })

    /** Leave a room */
    socket.on('room:leave', (data: { roomId: string }) => {
      const { roomId } = data
      const room = roomManager.rooms.get(roomId)
      if (room) {
        room.removePlayer(socket.id)
        void socket.leave(roomId)
        socket.to(roomId).emit('player:left', { playerId: socket.id })

        // Auto-cleanup empty rooms
        if (room.playerCount === 0) {
          roomManager.removeRoom(roomId)
        }
      }
    })

    /** Player input – apply impulse to their body */
    socket.on('player:input', (data: { roomId: string; impulse: { x: number; y: number; z: number } }) => {
      const room = roomManager.rooms.get(data.roomId)
      if (room) {
        room.applyImpulse(socket.id, data.impulse)
      }
    })

    /** On disconnect, remove from all rooms */
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Disconnected: ${socket.id}`)
      for (const [roomId, room] of roomManager.rooms) {
        if (room.bodies.has(socket.id)) {
          room.removePlayer(socket.id)
          socket.to(roomId).emit('player:left', { playerId: socket.id })
          if (room.playerCount === 0) {
            roomManager.removeRoom(roomId)
          }
        }
      }
    })
  })

  // Start the physics game loop
  roomManager.startLoop()

  fastify.addHook('onClose', async () => {
    roomManager.stopLoop()
  })
})
