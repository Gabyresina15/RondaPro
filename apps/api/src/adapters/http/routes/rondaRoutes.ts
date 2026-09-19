import type { FastifyPluginAsync } from 'fastify';
import type { Ronda } from '../../../domain/entities/Ronda.js';
import { TemplateNotFoundError } from '../../../application/templates/GetTemplate.js';
import { InvalidPhotoError } from '../../../application/rondas/AddRondaPhotos.js';
import { RondaCompletionError } from '../../../application/rondas/CompleteRonda.js';
import { PhotoNotFoundError } from '../../../application/rondas/GetRondaPhoto.js';
import { RondaNotFoundError } from '../../../application/rondas/GetRonda.js';
import { FindingNotFoundError } from '../../../application/rondas/ResolveFinding.js';
import { RondaAlreadyCompletedError } from '../../../application/rondas/SaveRondaAnswers.js';
import { SiteNotFoundError } from '../../../application/sites/GetSite.js';
import {
  addFindingBodySchema,
  addPhotosBodySchema,
  findingParamsSchema,
  rondaIdParamsSchema,
  rondaPhotoParamsSchema,
  saveAnswersBodySchema,
  startRondaBodySchema,
  updateFindingBodySchema,
} from '../schemas/rondaSchemas.js';

function serializeRonda(ronda: Ronda) {
  return {
    id: ronda.id,
    templateId: ronda.templateId,
    templateName: ronda.templateName,
    ownerId: ronda.ownerId,
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
    findings: ronda.findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      notes: finding.notes,
      severity: finding.severity,
      status: finding.status,
      itemIndex: finding.itemIndex ?? null,
      assignee: finding.assignee ?? null,
      resolutionNote: finding.resolutionNote ?? null,
      resolvedAt: finding.resolvedAt?.toISOString() ?? null,
      resolvedBy: finding.resolvedBy ?? null,
      createdAt: finding.createdAt.toISOString(),
    })),
    summary: ronda.summary ?? null,
    summarySource: ronda.summarySource ?? null,
    completedAt: ronda.completedAt?.toISOString() ?? null,
    createdAt: ronda.createdAt.toISOString(),
    updatedAt: ronda.updatedAt.toISOString(),
  };
}

function sendDomainError(reply: {
  code: (status: number) => { send: (payload: unknown) => unknown };
}, err: unknown) {
  if (
    err instanceof TemplateNotFoundError ||
    err instanceof RondaNotFoundError ||
    err instanceof PhotoNotFoundError ||
    err instanceof SiteNotFoundError ||
    err instanceof FindingNotFoundError
  ) {
    return reply.code(404).send({ error: 'NotFound', message: err.message });
  }
  if (err instanceof RondaAlreadyCompletedError) {
    return reply.code(409).send({ error: 'Conflict', message: err.message });
  }
  if (err instanceof InvalidPhotoError || err instanceof RondaCompletionError) {
    return reply.code(400).send({ error: 'ValidationError', message: err.message });
  }
  throw err;
}

export const rondaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/rondas', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const query = (request.query ?? {}) as {
      siteId?: string;
      status?: string;
      openFindings?: string;
    };
    let items = await app.container.listRondas.execute(request.authUser.id);
    if (query.siteId) {
      items = items.filter((r) => r.siteId === query.siteId);
    }
    if (query.status === 'in_progress' || query.status === 'completed') {
      items = items.filter((r) => r.status === query.status);
    }
    if (query.openFindings === 'true') {
      items = items.filter((r) => r.findings.some((f) => f.status === 'open'));
    }
    return reply.send({ items: items.map(serializeRonda) });
  });

  app.post('/rondas', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const parsed = startRondaBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    try {
      const ronda = await app.container.startRonda.execute({
        templateId: parsed.data.templateId,
        ownerId: request.authUser.id,
        location: parsed.data.location,
        siteId: parsed.data.siteId,
      });
      return reply.code(201).send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get('/rondas/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid ronda id' });
    }
    try {
      const ronda = await app.container.getRonda.execute(
        params.data.id,
        request.authUser.id,
      );
      return reply.send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.patch('/rondas/:id/answers', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    const body = saveAnswersBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid answers payload',
      });
    }
    try {
      const ronda = await app.container.saveRondaAnswers.execute(
        params.data.id,
        request.authUser.id,
        body.data.answers,
      );
      return reply.send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post('/rondas/:id/photos', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    const body = addPhotosBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid photos payload',
      });
    }
    try {
      const ronda = await app.container.addRondaPhotos.execute(
        params.data.id,
        request.authUser.id,
        body.data.photos,
      );
      return reply.send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.get('/rondas/:id/photos/:photoId', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaPhotoParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid photo id' });
    }
    try {
      const photo = await app.container.getRondaPhoto.execute(
        params.data.id,
        params.data.photoId,
        request.authUser.id,
      );
      return reply
        .header('Content-Type', photo.mimeType)
        .header('Content-Disposition', `inline; filename="${photo.filename}"`)
        .send(photo.bytes);
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post('/rondas/:id/findings', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    const body = addFindingBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid finding payload',
      });
    }
    try {
      const ronda = await app.container.addFinding.execute({
        rondaId: params.data.id,
        ownerId: request.authUser.id,
        title: body.data.title,
        notes: body.data.notes,
        severity: body.data.severity,
        itemIndex: body.data.itemIndex,
      });
      return reply.code(201).send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.patch('/rondas/:id/findings/:findingId', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = findingParamsSchema.safeParse(request.params);
    const body = updateFindingBodySchema.safeParse(request.body ?? {});
    if (!params.success || !body.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid finding update',
      });
    }
    try {
      const ronda = await app.container.updateFinding.execute({
        rondaId: params.data.id,
        ownerId: request.authUser.id,
        findingId: params.data.findingId,
        status: body.data.status,
        assignee: body.data.assignee,
        resolutionNote: body.data.resolutionNote,
      });
      return reply.send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post('/rondas/:id/findings/:findingId/resolve', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = findingParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid finding id' });
    }
    try {
      const ronda = await app.container.resolveFinding.execute(
        params.data.id,
        request.authUser.id,
        params.data.findingId,
      );
      return reply.send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });

  app.post('/rondas/:id/complete', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = rondaIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid ronda id' });
    }
    try {
      const ronda = await app.container.completeRonda.execute(
        params.data.id,
        request.authUser.id,
      );
      return reply.send(serializeRonda(ronda));
    } catch (err) {
      return sendDomainError(reply, err);
    }
  });
};
