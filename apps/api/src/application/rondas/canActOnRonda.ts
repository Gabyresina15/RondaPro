import type { Ronda } from '../../domain/entities/Ronda.js';

export function canActOnRonda(
  ronda: Ronda | null | undefined,
  actorId: string,
): ronda is Ronda {
  return Boolean(
    ronda && (ronda.ownerId === actorId || ronda.assigneeId === actorId),
  );
}
