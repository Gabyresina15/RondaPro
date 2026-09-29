import type { FastifyPluginAsync } from 'fastify';
import { RondaNotFoundError } from '../../../application/rondas/GetRonda.js';
import { rondaIdParamsSchema } from '../schemas/rondaSchemas.js';

export const rondaDeleteRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.delete('/rondas/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid ronda id' });
    }
    try {
      await app.container.deleteRonda.execute(params.data.id, request.authUser.id);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof RondaNotFoundError) {
        return reply.code(404).send({ error: 'NotFound', message: err.message });
      }
      throw err;
    }
  });
};
