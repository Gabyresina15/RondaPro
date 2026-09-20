import type { UserPublic } from '../../domain/entities/User.js';
import { toUserPublic } from '../../domain/entities/User.js';
import type { UserRepository } from '../../domain/ports/UserRepository.js';
import { ForbiddenError } from '../rondas/AssignRonda.js';

export class ListUsers {
  constructor(private readonly users: UserRepository) {}

  async execute(role: 'auditor' | 'supervisor'): Promise<UserPublic[]> {
    if (role !== 'supervisor') {
      throw new ForbiddenError();
    }
    const items = await this.users.listAll();
    return items.map(toUserPublic);
  }
}
