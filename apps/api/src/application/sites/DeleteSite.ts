import type { SiteRepository } from '../../domain/ports/SiteRepository.js';
import { SiteNotFoundError } from './GetSite.js';

export class DeleteSite {
  constructor(private readonly sites: SiteRepository) {}

  async execute(id: string, ownerId: string): Promise<void> {
    const deleted = await this.sites.delete(id, ownerId);
    if (!deleted) {
      throw new SiteNotFoundError(id);
    }
  }
}
