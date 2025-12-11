import { FastifyInstance } from 'fastify'
import { login, register, getProfile } from '../controllers/authController'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', register)
  fastify.post('/login', login)
  fastify.get('/me', { 
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
    }] 
  }, getProfile)
}