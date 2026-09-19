import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { LoginUser } from '../../../application/auth/LoginUser.js';
import type { RegisterUser } from '../../../application/auth/RegisterUser.js';
import type { AddRondaPhotos } from '../../../application/rondas/AddRondaPhotos.js';
import type { CompleteRonda } from '../../../application/rondas/CompleteRonda.js';
import type { GetRonda } from '../../../application/rondas/GetRonda.js';
import type { GetRondaPhoto } from '../../../application/rondas/GetRondaPhoto.js';
import type { ListRondas } from '../../../application/rondas/ListRondas.js';
import type { SaveRondaAnswers } from '../../../application/rondas/SaveRondaAnswers.js';
import type { StartRonda } from '../../../application/rondas/StartRonda.js';
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
