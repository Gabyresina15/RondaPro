import type { FastifyPluginAsync } from 'fastify';
import { TemplateNotFoundError } from '../../../application/templates/GetTemplate.js';
import {
  createTemplateBodySchema,
  templateIdParamsSchema,
  updateTemplateBodySchema,
} from '../schemas/templateSchemas.js';

function serializeTemplate(template: {
  id: string;
  name: string;
  description: string;
  items: { label: string; required: boolean; type: string }[];
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    items: template.items,
    ownerId: template.ownerId,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export const templateRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/templates', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const templates = await app.container.listTemplates.execute(
      request.authUser.id,
    );
    return reply.send({ items: templates.map(serializeTemplate) });
  });

  app.post('/templates', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const parsed = createTemplateBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: parsed.error.issues.map((i) => i.message).join('; '),
      });
    }

    const template = await app.container.createTemplate.execute({
      ...parsed.data,
      ownerId: request.authUser.id,
    });
    return reply.code(201).send(serializeTemplate(template));
  });

  app.get('/templates/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = templateIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid template id',
      });
    }

    try {
      const template = await app.container.getTemplate.execute(
        params.data.id,
        request.authUser.id,
      );
      return reply.send(serializeTemplate(template));
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.code(404).send({
          error: 'NotFound',
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.patch('/templates/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = templateIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid template id',
      });
    }
    const body = updateTemplateBodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: body.error.issues.map((i) => i.message).join('; '),
      });
    }

    try {
      const template = await app.container.updateTemplate.execute(
        params.data.id,
        request.authUser.id,
        body.data,
      );
      return reply.send(serializeTemplate(template));
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.code(404).send({
          error: 'NotFound',
          message: err.message,
        });
      }
      throw err;
    }
  });

  app.delete('/templates/:id', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const params = templateIdParamsSchema.safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({
        error: 'ValidationError',
        message: 'Invalid template id',
      });
    }

    try {
      await app.container.deleteTemplate.execute(
        params.data.id,
        request.authUser.id,
      );
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof TemplateNotFoundError) {
        return reply.code(404).send({
          error: 'NotFound',
          message: err.message,
        });
      }
      throw err;
    }
  });
};
