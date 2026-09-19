import type { Site } from '../../domain/entities/Site.js';
import type { SiteRepository } from '../../domain/ports/SiteRepository.js';

export class SiteNotFoundError extends Error {
  constructor(id: string) {
    super(`Site not found: ${id}`);
    this.name = 'SiteNotFoundError';
  }
}

export class GetSite {
  constructor(private readonly sites: SiteRepository) {}

  async execute(id: string, ownerId: string): Promise<Site> {
    const site = await this.sites.findById(id);
    if (!site || site.ownerId !== ownerId) {
      throw new SiteNotFoundError(id);
    }
    return site;
  }
}
