import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { LoginUser } from '../../../application/auth/LoginUser.js';
import type { RegisterUser } from '../../../application/auth/RegisterUser.js';
import type { GetDashboard } from '../../../application/dashboard/GetDashboard.js';
import type { AddFinding } from '../../../application/rondas/AddFinding.js';
import type { AddRondaPhotos } from '../../../application/rondas/AddRondaPhotos.js';
import type { CompleteRonda } from '../../../application/rondas/CompleteRonda.js';
import type { GetRonda } from '../../../application/rondas/GetRonda.js';
import type { GetRondaPhoto } from '../../../application/rondas/GetRondaPhoto.js';
import type { ListRondas } from '../../../application/rondas/ListRondas.js';
import type { ResolveFinding } from '../../../application/rondas/ResolveFinding.js';
import type { UpdateFinding } from '../../../application/rondas/UpdateFinding.js';
import type { SaveRondaAnswers } from '../../../application/rondas/SaveRondaAnswers.js';
import type { StartRonda } from '../../../application/rondas/StartRonda.js';
import type { CreateSite } from '../../../application/sites/CreateSite.js';
import type { DeleteSite } from '../../../application/sites/DeleteSite.js';
import type { GetSite } from '../../../application/sites/GetSite.js';
import type { ListSites } from '../../../application/sites/ListSites.js';
import type { UpdateSite } from '../../../application/sites/UpdateSite.js';
import type { CreateTemplate } from '../../../application/templates/CreateTemplate.js';
import type { DeleteTemplate } from '../../../application/templates/DeleteTemplate.js';
import type { GetTemplate } from '../../../application/templates/GetTemplate.js';
import type { ListTemplates } from '../../../application/templates/ListTemplates.js';
import type { UpdateTemplate } from '../../../application/templates/UpdateTemplate.js';

export interface AppContainer {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  createTemplate: CreateTemplate;
  listTemplates: ListTemplates;
  getTemplate: GetTemplate;
  updateTemplate: UpdateTemplate;
  deleteTemplate: DeleteTemplate;
  startRonda: StartRonda;
  listRondas: ListRondas;
  getRonda: GetRonda;
  saveRondaAnswers: SaveRondaAnswers;
  addRondaPhotos: AddRondaPhotos;
  completeRonda: CompleteRonda;
  getRondaPhoto: GetRondaPhoto;
  addFinding: AddFinding;
  resolveFinding: ResolveFinding;
  updateFinding: UpdateFinding;
  createSite: CreateSite;
  listSites: ListSites;
  getSite: GetSite;
  updateSite: UpdateSite;
  deleteSite: DeleteSite;
  getDashboard: GetDashboard;
}

declare module 'fastify' {
  interface FastifyInstance {
    container: AppContainer;
  }
}

const containerPluginImpl: FastifyPluginAsync<{ container: AppContainer }> =
  async (app, opts) => {
    app.decorate('container', opts.container);
  };

export const containerPlugin = fp(containerPluginImpl, {
  name: 'container-plugin',
});
