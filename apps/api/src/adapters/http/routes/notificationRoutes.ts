import type { FastifyPluginAsync } from 'fastify';

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/notifications', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const items = await app.container.listNotifications.execute(
      request.authUser.id,
    );
    return reply.send({
      items: items.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        rondaId: n.rondaId ?? null,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  });

  app.patch('/notifications/:id/read', async (request, reply) => {
    if (!request.authUser) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
    const { id } = request.params as { id: string };
    const item = await app.container.markNotificationRead.execute(
      id,
      request.authUser.id,
    );
    if (!item) {
      return reply.code(404).send({ error: 'NotFound' });
    }
    return reply.send({
      id: item.id,
      title: item.title,
      body: item.body,
      rondaId: item.rondaId ?? null,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    });
  });
};
