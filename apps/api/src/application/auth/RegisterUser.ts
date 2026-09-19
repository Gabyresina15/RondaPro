import type { UserPublic } from '../../domain/entities/User.js';
import { toUserPublic } from '../../domain/entities/User.js';
import type { PasswordHasher } from '../../domain/ports/PasswordHasher.js';
import type { TokenService } from '../../domain/ports/TokenService.js';
import type { UserRepository } from '../../domain/ports/UserRepository.js';

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

export interface RegisterUserResult {
  user: UserPublic;
  token: string;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredError(email);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const user = await this.users.create({
      email,
      passwordHash,
      name: input.name.trim(),
    });

    const token = this.tokens.sign({ sub: user.id, email: user.email });
    return { user: toUserPublic(user), token };
  }
}
