import type { FastifyPluginAsync } from 'fastify';
import mongoose from 'mongoose';
import { loadConfig } from '../../../config.js';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    const mongoReady = mongoose.connection.readyState === 1;
    const config = loadConfig();
    return {
      status: mongoReady ? 'ok' : 'degraded',
      service: 'rondapro-api',
      mongo: mongoReady ? 'connected' : 'disconnected',
      geminiConfigured: Boolean(config.GEMINI_API_KEY),
      geminiModel: config.GEMINI_MODEL,
      timestamp: new Date().toISOString(),
    };
  });
};
