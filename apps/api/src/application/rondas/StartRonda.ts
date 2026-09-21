import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import type { Ronda } from '../../domain/entities/Ronda.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import type { SiteRepository } from '../../domain/ports/SiteRepository.js';
import { SiteNotFoundError } from '../sites/GetSite.js';
import { TemplateNotFoundError } from '../templates/GetTemplate.js';

export class StartRonda {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly templates: ChecklistTemplateRepository,
    private readonly sites: SiteRepository,
  ) {}

  async execute(input: {
    templateId: string;
    ownerId: string;
    location: string;
    siteId?: string;
  }): Promise<Ronda> {
    const template = await this.templates.findById(input.templateId);
    if (!template) {
      throw new TemplateNotFoundError(input.templateId);
    }

    let siteName: string | undefined;
    if (input.siteId) {
      const site = await this.sites.findById(input.siteId);
      if (!site) {
        throw new SiteNotFoundError(input.siteId);
      }
      siteName = site.name;
    }

    const location = input.location.trim() || siteName || '';

    return this.rondas.create({
      templateId: template.id,
      templateName: template.name,
      ownerId: input.ownerId,
      siteId: input.siteId,
      siteName,
      location,
      answers: template.items.map((item, itemIndex) => ({
        itemIndex,
        label: item.label,
        type: item.type,
        ...(item.type === 'bool' ? { boolValue: false } : {}),
      })),
    });
  }
}
