import type { FastifyPluginAsync } from 'fastify';
import { ForbiddenError } from '../../../application/rondas/AssignRonda.js';
import { RondaNotFoundError } from '../../../application/rondas/GetRonda.js';
import { rondaIdParamsSchema } from '../schemas/rondaSchemas.js';

export const assignRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.patch('/rondas/:id/assign', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    const body = (request.body ?? {}) as { assigneeId?: string };
    if (!params.success || !body.assigneeId) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid assign payload',
      });
    }
    try {
      const ronda = await app.container.assignRonda.execute({
        rondaId: params.data.id,
        actorId: request.authUser.id,
        role: request.authUser.role,
        assigneeId: body.assigneeId,
      });
      return reply.send({
        id: ronda.id,
        templateId: ronda.templateId,
        templateName: ronda.templateName,
        ownerId: ronda.ownerId,
        assigneeId: ronda.assigneeId ?? null,
        assigneeName: ronda.assigneeName ?? null,
        siteId: ronda.siteId ?? null,
        siteName: ronda.siteName ?? null,
        location: ronda.location,
        status: ronda.status,
        answers: ronda.answers,
        photos: ronda.photos.map((photo) => ({
          id: photo.id,
          filename: photo.filename,
          mimeType: photo.mimeType,
          itemIndex: photo.itemIndex ?? null,
          url: `/rondas/${ronda.id}/photos/${photo.id}`,
          createdAt: photo.createdAt.toISOString(),
        })),
        findings: ronda.findings,
        summary: ronda.summary ?? null,
        summarySource: ronda.summarySource ?? null,
        completedAt: ronda.completedAt?.toISOString() ?? null,
        createdAt: ronda.createdAt.toISOString(),
        updatedAt: ronda.updatedAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof ForbiddenError) {
        return reply.code(403).send({ error: 'Forbidden', message: err.message });
      }
      if (err instanceof RondaNotFoundError) {
        return reply.code(404).send({ error: 'NotFound', message: err.message });
      }
      throw err;
    }
  });
};
