import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { ListNotifications } from './application/notifications/ListNotifications.js';
import { MarkNotificationRead } from './application/notifications/MarkNotificationRead.js';
import { ListUsers } from './application/auth/ListUsers.js';
import { LoginUser } from './application/auth/LoginUser.js';
import { RegisterUser } from './application/auth/RegisterUser.js';
import { GetDashboard } from './application/dashboard/GetDashboard.js';
import { AssignRonda } from './application/rondas/AssignRonda.js';
import { CreateInspectionOrder } from './application/rondas/CreateInspectionOrder.js';
import { AddFinding } from './application/rondas/AddFinding.js';
import { AddRondaPhotos } from './application/rondas/AddRondaPhotos.js';
import { CompleteRonda } from './application/rondas/CompleteRonda.js';
import { ExportRondaPdf } from './application/rondas/ExportRondaPdf.js';
import { GetRonda } from './application/rondas/GetRonda.js';
import { GetRondaPhoto } from './application/rondas/GetRondaPhoto.js';
import { ListRondas } from './application/rondas/ListRondas.js';
import { ResolveFinding } from './application/rondas/ResolveFinding.js';
import { UpdateFinding } from './application/rondas/UpdateFinding.js';
import { SaveRondaAnswers } from './application/rondas/SaveRondaAnswers.js';
import { StartRonda } from './application/rondas/StartRonda.js';
import { CreateSite } from './application/sites/CreateSite.js';
import { DeleteSite } from './application/sites/DeleteSite.js';
import { GetSite } from './application/sites/GetSite.js';
import { ListSites } from './application/sites/ListSites.js';
import { UpdateSite } from './application/sites/UpdateSite.js';
import { CreateTemplate } from './application/templates/CreateTemplate.js';
import { DeleteTemplate } from './application/templates/DeleteTemplate.js';
import { GetTemplate } from './application/templates/GetTemplate.js';
import { ListTemplates } from './application/templates/ListTemplates.js';
import { UpdateTemplate } from './application/templates/UpdateTemplate.js';
import { MongoChecklistTemplateRepository } from './adapters/persistence/MongoChecklistTemplateRepository.js';
import { MongoRondaRepository } from './adapters/persistence/MongoRondaRepository.js';
import { MongoSiteRepository } from './adapters/persistence/MongoSiteRepository.js';
import { MongoNotificationRepository } from './adapters/persistence/MongoNotificationRepository.js';
import { MongoUserRepository } from './adapters/persistence/MongoUserRepository.js';
import { BcryptPasswordHasher } from './adapters/security/BcryptPasswordHasher.js';
import { JwtTokenService } from './adapters/security/JwtTokenService.js';
import { LocalPhotoStorage } from './adapters/storage/LocalPhotoStorage.js';
import {
  ConnectionFallbackSummaryGenerator,
  HeuristicSummaryGenerator,
} from './adapters/llm/HeuristicSummaryGenerator.js';
import { GeminiSummaryGenerator } from './adapters/llm/GeminiSummaryGenerator.js';
import {
  FallbackSummaryGenerator,
  OpenAiSummaryGenerator,
} from './adapters/llm/OpenAiSummaryGenerator.js';
import { authPlugin } from './adapters/http/plugins/authPlugin.js';
import { containerPlugin } from './adapters/http/plugins/containerPlugin.js';
import { notificationRoutes } from './adapters/http/routes/notificationRoutes.js';
import { assignRoutes } from './adapters/http/routes/assignRoutes.js';
import { orderRoutes } from './adapters/http/routes/orderRoutes.js';
import { authRoutes } from './adapters/http/routes/authRoutes.js';
import { dashboardRoutes } from './adapters/http/routes/dashboardRoutes.js';
import { healthRoutes } from './adapters/http/routes/healthRoutes.js';
import { rondaRoutes } from './adapters/http/routes/rondaRoutes.js';
import { siteRoutes } from './adapters/http/routes/siteRoutes.js';
import { templateRoutes } from './adapters/http/routes/templateRoutes.js';
import type { AppConfig } from './config.js';
import type { SummaryGenerator } from './domain/ports/SummaryGenerator.js';

function buildSummaryGenerator(config: AppConfig): SummaryGenerator {
  const heuristic = new HeuristicSummaryGenerator();
  if (config.GEMINI_API_KEY) {
    return new FallbackSummaryGenerator(
      new GeminiSummaryGenerator({
        apiKey: config.GEMINI_API_KEY,
        model: config.GEMINI_MODEL,
        baseUrl: config.GEMINI_BASE_URL,
      }),
      new ConnectionFallbackSummaryGenerator(),
    );
  }
  if (!config.OPENAI_API_KEY) {
    return heuristic;
  }
  return new FallbackSummaryGenerator(
    new OpenAiSummaryGenerator({
      apiKey: config.OPENAI_API_KEY,
      baseUrl: config.OPENAI_BASE_URL,
      model: config.OPENAI_MODEL,
    }),
    heuristic,
  );
}

export async function createApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    bodyLimit: 15 * 1024 * 1024,
  });

  const users = new MongoUserRepository();
  const notifications = new MongoNotificationRepository();
  const templates = new MongoChecklistTemplateRepository();
  const rondas = new MongoRondaRepository();
  const sites = new MongoSiteRepository();
  const photos = new LocalPhotoStorage(config.UPLOAD_DIR);
  const hasher = new BcryptPasswordHasher();
  const tokens = new JwtTokenService(config.JWT_SECRET, config.JWT_EXPIRES_IN);
  const summaries = buildSummaryGenerator(config);

  const startRonda = new StartRonda(rondas, templates, sites);
  const assignRonda = new AssignRonda(rondas, users, notifications);

  const container = {
    registerUser: new RegisterUser(users, hasher, tokens),
    loginUser: new LoginUser(users, hasher, tokens),
    listUsers: new ListUsers(users),
    createTemplate: new CreateTemplate(templates),
    listTemplates: new ListTemplates(templates),
    getTemplate: new GetTemplate(templates),
    updateTemplate: new UpdateTemplate(templates),
    deleteTemplate: new DeleteTemplate(templates),
    startRonda,
    listRondas: new ListRondas(rondas),
    getRonda: new GetRonda(rondas),
    exportRondaPdf: new ExportRondaPdf(rondas),
    saveRondaAnswers: new SaveRondaAnswers(rondas),
    addRondaPhotos: new AddRondaPhotos(rondas, photos),
    completeRonda: new CompleteRonda(rondas, templates, summaries),
    getRondaPhoto: new GetRondaPhoto(rondas, photos),
    addFinding: new AddFinding(rondas),
    resolveFinding: new ResolveFinding(rondas),
    updateFinding: new UpdateFinding(rondas),
    assignRonda,
    createInspectionOrder: new CreateInspectionOrder(startRonda, assignRonda),
    listNotifications: new ListNotifications(notifications),
    markNotificationRead: new MarkNotificationRead(notifications),
    createSite: new CreateSite(sites),
    listSites: new ListSites(sites),
    getSite: new GetSite(sites),
    updateSite: new UpdateSite(sites),
    deleteSite: new DeleteSite(sites),
    getDashboard: new GetDashboard(rondas, templates, sites),
  };

  await app.register(cors, {
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
  });
  await app.register(authPlugin, { tokens });
  await app.register(containerPlugin, { container });
  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(templateRoutes);
  await app.register(rondaRoutes);
  await app.register(assignRoutes);
  await app.register(orderRoutes);
  await app.register(siteRoutes);
  await app.register(notificationRoutes);
  await app.register(dashboardRoutes);

  return app;
}
