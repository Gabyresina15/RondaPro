import type { Site } from '../entities/Site.js';

export interface CreateSiteInput {
  name: string;
  address: string;
  notes: string;
  ownerId: string;
}

export interface UpdateSiteInput {
  name?: string;
  address?: string;
  notes?: string;
}

export interface SiteRepository {
  create(input: CreateSiteInput): Promise<Site>;
  findByOwner(ownerId: string): Promise<Site[]>;
  findById(id: string): Promise<Site | null>;
  update(id: string, ownerId: string, input: UpdateSiteInput): Promise<Site | null>;
  delete(id: string, ownerId: string): Promise<boolean>;
}
