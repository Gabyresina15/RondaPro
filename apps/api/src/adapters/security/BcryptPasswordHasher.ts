import bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../domain/ports/PasswordHasher.js';

const SALT_ROUNDS = 12;

export class BcryptPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
