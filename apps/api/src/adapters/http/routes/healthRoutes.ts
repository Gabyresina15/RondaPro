import type { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    const mongoReady = mongoose.connection.readyState === 1;
    return {
      status: mongoReady ? 'ok' : 'degraded',
      service: 'rondapro-api',
      mongo: mongoReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  });
};
