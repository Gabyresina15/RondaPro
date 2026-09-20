import type { Site } from '../../domain/entities/Site.js';
import type { SiteRepository } from '../../domain/ports/SiteRepository.js';

export class ListSites {
  constructor(private readonly sites: SiteRepository) {}

  execute(_ownerId: string): Promise<Site[]> {
    return this.sites.findAll();
  }
}
