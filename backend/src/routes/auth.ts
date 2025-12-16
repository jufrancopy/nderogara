import { FastifyInstance } from 'fastify'
import { login, register, getProfile, getUsersByRole, updateProfile, updateProfileImage } from '../controllers/authController'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', register)
  fastify.post('/login', login)
  fastify.get('/me', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
    }]
  }, getProfile)
  fastify.get('/users-by-role', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
    }]
  }, getUsersByRole)
  fastify.put('/profile', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
    }]
  }, updateProfile)
  fastify.post('/profile/image', {
    preHandler: [async (request, reply) => {
      await request.jwtVerify()
    }]
  }, updateProfileImage)
}
