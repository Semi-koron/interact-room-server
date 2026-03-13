import fp from 'fastify-plugin'
import { Server as SocketIOServer } from 'socket.io'

declare module 'fastify' {
  interface FastifyInstance {
    io: SocketIOServer
  }
}

export default fp(async (fastify) => {
  const io = new SocketIOServer(fastify.server, {
    cors: { origin: '*' },
  })

  fastify.decorate('io', io)

  fastify.addHook('onClose', async () => {
    io.close()
  })
})
