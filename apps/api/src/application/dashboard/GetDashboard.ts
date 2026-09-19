import type { ChecklistTemplateRepository } from '../../domain/ports/ChecklistTemplateRepository.js';
import type { RondaRepository } from '../../domain/ports/RondaRepository.js';
import type { SiteRepository } from '../../domain/ports/SiteRepository.js';

export interface DashboardStats {
  sitesCount: number;
  templatesCount: number;
  rondasInProgress: number;
  rondasCompleted: number;
  photosTotal: number;
  findingsOpen: number;
  findingsHigh: number;
  lastCompletedAt: string | null;
}

export class GetDashboard {
  constructor(
    private readonly rondas: RondaRepository,
    private readonly templates: ChecklistTemplateRepository,
    private readonly sites: SiteRepository,
  ) {}

  async execute(ownerId: string): Promise<DashboardStats> {
    const [rondas, templates, sites] = await Promise.all([
      this.rondas.findByOwner(ownerId),
      this.templates.findByOwner(ownerId),
      this.sites.findByOwner(ownerId),
    ]);

    const completed = rondas.filter((r) => r.status === 'completed');
    const last = completed[0]?.completedAt ?? null;

    return {
      sitesCount: sites.length,
      templatesCount: templates.length,
      rondasInProgress: rondas.filter((r) => r.status === 'in_progress').length,
      rondasCompleted: completed.length,
      photosTotal: rondas.reduce((sum, r) => sum + r.photos.length, 0),
      findingsOpen: rondas.reduce(
        (sum, r) => sum + r.findings.filter((f) => f.status === 'open').length,
        0,
      ),
      findingsHigh: rondas.reduce(
        (sum, r) =>
          sum +
          r.findings.filter((f) => f.status === 'open' && f.severity === 'high')
            .length,
        0,
      ),
      lastCompletedAt: last ? last.toISOString() : null,
    };
  }
}
