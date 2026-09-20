import type { UserPublic } from '../../domain/entities/User.js';
import { toUserPublic } from '../../domain/entities/User.js';
import type { PasswordHasher } from '../../domain/ports/PasswordHasher.js';
import type { TokenService } from '../../domain/ports/TokenService.js';
import type { UserRepository } from '../../domain/ports/UserRepository.js';

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserResult {
  user: UserPublic;
  token: string;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const ok = await this.hasher.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokens.sign({
      sub: user.id,
      email: user.email,
      role: user.role ?? 'auditor',
    });
    return { user: toUserPublic(user), token };
  }
}
