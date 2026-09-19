import type { Site } from '../../domain/entities/Site.js';
import type { SiteRepository } from '../../domain/ports/SiteRepository.js';

export class CreateSite {
  constructor(private readonly sites: SiteRepository) {}

  execute(input: {
    name: string;
    address: string;
    notes: string;
    ownerId: string;
  }): Promise<Site> {
    return this.sites.create({
      name: input.name.trim(),
      address: input.address.trim(),
      notes: input.notes.trim(),
      ownerId: input.ownerId,
    });
  }
}
