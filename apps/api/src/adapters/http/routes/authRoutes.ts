import type { FastifyPluginAsync } from 'fastify';
import {
  EmailAlreadyRegisteredError,
} from '../../../application/auth/RegisterUser.js';
import { InvalidCredentialsError } from '../../../application/auth/LoginUser.js';
import {
  loginBodySchema,
  registerBodySchema,
} from '../schemas/authSchemas.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }

    try {
      const result = await app.container.registerUser.execute(parsed.data);
      return reply.code(201).send(result);
    } catch (err) {
      if (err instanceof EmailAlreadyRegisteredError) {
        return reply.code(409).send({
          error: 'Conflict',
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }

    try {
      const result = await app.container.loginUser.execute(parsed.data);
      return reply.code(200).send(result);
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: err.message,
        });
      }
      throw err;
    }
  });
};
