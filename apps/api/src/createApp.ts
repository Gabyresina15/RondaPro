import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { LoginUser } from './application/auth/LoginUser.js';
import { RegisterUser } from './application/auth/RegisterUser.js';
import { CreateTemplate } from './application/templates/CreateTemplate.js';
import { DeleteTemplate } from './application/templates/DeleteTemplate.js';
import { GetTemplate } from './application/templates/GetTemplate.js';
import { ListTemplates } from './application/templates/ListTemplates.js';
import { UpdateTemplate } from './application/templates/UpdateTemplate.js';
import { MongoChecklistTemplateRepository } from './adapters/persistence/MongoChecklistTemplateRepository.js';
import { MongoUserRepository } from './adapters/persistence/MongoUserRepository.js';
import { BcryptPasswordHasher } from './adapters/security/BcryptPasswordHasher.js';
import { JwtTokenService } from './adapters/security/JwtTokenService.js';
import { authPlugin } from './adapters/http/plugins/authPlugin.js';
import { containerPlugin } from './adapters/http/plugins/containerPlugin.js';
import { authRoutes } from './adapters/http/routes/authRoutes.js';
import { healthRoutes } from './adapters/http/routes/healthRoutes.js';
import { templateRoutes } from './adapters/http/routes/templateRoutes.js';
import type { AppConfig } from './config.js';

export async function createApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
  });

  const users = new MongoUserRepository();
  const templates = new MongoChecklistTemplateRepository();
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService(config.JWT_SECRET, config.JWT_EXPIRES_IN);

  const container = {
    registerUser: new RegisterUser(users, hasher, tokens),
    loginUser: new LoginUser(users, hasher, tokens),
    createTemplate: new CreateTemplate(templates),
    listTemplates: new ListTemplates(templates),
    getTemplate: new GetTemplate(templates),
    updateTemplate: new UpdateTemplate(templates),
    deleteTemplate: new DeleteTemplate(templates),
  };

  await app.register(cors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
  });
  await app.register(authPlugin, { tokens });
  await app.register(containerPlugin, { container });
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(templateRoutes);

  return app;
}
