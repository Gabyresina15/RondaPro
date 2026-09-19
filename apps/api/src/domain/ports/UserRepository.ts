import type { User } from '../entities/User.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name: string;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
