import type { Site } from '../../domain/entities/Site.js';
import type { SiteRepository } from '../../domain/ports/SiteRepository.js';
import { SiteNotFoundError } from './GetSite.js';

export class UpdateSite {
  constructor(private readonly sites: SiteRepository) {}

  async execute(
    id: string,
    ownerId: string,
    input: { name?: string; address?: string; notes?: string; parentId?: string | null },
  ): Promise<Site> {
    const updated = await this.sites.update(id, ownerId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.address !== undefined ? { address: input.address.trim() } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
    });
    if (!updated) {
      throw new SiteNotFoundError(id);
    }
    return updated;
  }
}
