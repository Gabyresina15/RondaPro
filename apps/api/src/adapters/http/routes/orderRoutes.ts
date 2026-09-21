import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ForbiddenError } from '../../../application/rondas/AssignRonda.js';
import { RondaNotFoundError } from '../../../application/rondas/GetRonda.js';
import { TemplateNotFoundError } from '../../../application/templates/GetTemplate.js';
import { SiteNotFoundError } from '../../../application/sites/GetSite.js';

const createOrderBodySchema = z.object({
  templateId: z.string().min(1),
  assigneeId: z.string().min(1),
  location: z.string().max(200).default(''),
  siteId: z.string().min(1).optional(),
});

export const orderRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.post('/rondas/orders', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const parsed = createOrderBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    try {
      const ronda = await app.container.createInspectionOrder.execute({
        actorId: request.authUser.id,
        role: request.authUser.role,
        templateId: parsed.data.templateId,
        assigneeId: parsed.data.assigneeId,
        location: parsed.data.location,
        siteId: parsed.data.siteId,
      });
      return reply.code(201).send({
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
      if (
        err instanceof TemplateNotFoundError ||
        err instanceof SiteNotFoundError ||
        err instanceof RondaNotFoundError
      ) {
        return reply.code(404).send({ error: 'NotFound', message: err.message });
      }
      throw err;
    }
  });
};
