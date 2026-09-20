import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import type { TokenService } from '../../../domain/ports/TokenService.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'auditor' | 'supervisor';
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }

  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export interface AuthPluginOptions {
  tokens: TokenService;
}

const authPluginImpl: FastifyPluginAsync<AuthPluginOptions> = async (
  app,
  opts,
) => {
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      const header = request.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing Bearer token' });
      }
      const token = header.slice('Bearer '.length).trim();
      if (!token) {
        return reply
          .code(401)
          .send({ error: 'Unauthorized', message: 'Missing Bearer token' });
      }
      try {
        const payload = opts.tokens.verify(token);
        request.authUser = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };
      } catch {
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
      }
    },
  );
};

export const authPlugin = fp(authPluginImpl, { name: 'auth-plugin' });
