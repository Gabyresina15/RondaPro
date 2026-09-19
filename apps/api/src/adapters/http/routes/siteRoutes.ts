import type { FastifyPluginAsync } from 'fastify';
import { SiteNotFoundError } from '../../../application/sites/GetSite.js';
import {
  createSiteBodySchema,
  siteIdParamsSchema,
  updateSiteBodySchema,
} from '../schemas/siteSchemas.js';

function serializeSite(site: {
  id: string;
  name: string;
  address: string;
  notes: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: site.id,
    name: site.name,
    address: site.address,
    notes: site.notes,
    ownerId: site.ownerId,
    createdAt: site.createdAt.toISOString(),
    updatedAt: site.updatedAt.toISOString(),
  };
}

export const siteRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/sites', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const items = await app.container.listSites.execute(request.authUser.id);
    return reply.send({ items: items.map(serializeSite) });
  });

  app.post('/sites', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const parsed = createSiteBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }
    const site = await app.container.createSite.execute({
      ...parsed.data,
      ownerId: request.authUser.id,
    });
    return reply.code(201).send(serializeSite(site));
  });

  app.get('/sites/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = siteIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid site id' });
    }
    try {
      const site = await app.container.getSite.execute(
        params.data.id,
        request.authUser.id,
      );
      return reply.send(serializeSite(site));
    } catch (err) {
      if (err instanceof SiteNotFoundError) {
        return reply.code(404).send({ error: 'NotFound', message: err.message });
      }
      throw err;
    }
  });

  app.patch('/sites/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = siteIdParamsSchema.safeParse(request.params);
    const body = updateSiteBodySchema.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid site payload' });
    }
    try {
      const site = await app.container.updateSite.execute(
        params.data.id,
        request.authUser.id,
        body.data,
      );
      return reply.send(serializeSite(site));
    } catch (err) {
      if (err instanceof SiteNotFoundError) {
        return reply.code(404).send({ error: 'NotFound', message: err.message });
      }
      throw err;
    }
  });

  app.delete('/sites/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = siteIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'ValidationError', message: 'Invalid site id' });
    }
    try {
      await app.container.deleteSite.execute(params.data.id, request.authUser.id);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof SiteNotFoundError) {
        return reply.code(404).send({ error: 'NotFound', message: err.message });
      }
      throw err;
    }
  });
};
