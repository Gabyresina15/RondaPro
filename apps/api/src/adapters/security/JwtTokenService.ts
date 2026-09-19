import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type {
  TokenPayload,
  TokenService,
} from '../../domain/ports/TokenService.js';

export class JwtTokenService implements TokenService {
  private readonly signOptions: SignOptions;

  constructor(
    private readonly secret: string,
    expiresIn: string,
  ) {
    this.signOptions = {
      expiresIn: expiresIn as SignOptions['expiresIn'],
    };
  }

  sign(payload: TokenPayload): string {
    return jwt.sign(
      { email: payload.email },
      this.secret,
      { ...this.signOptions, subject: payload.sub },
    );
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret);
    if (typeof decoded === 'string') {
      throw new Error('Invalid token payload');
    }
    const payload = decoded as JwtPayload;
    if (!payload.sub || typeof payload.email !== 'string') {
      throw new Error('Invalid token payload');
    }
    return { sub: payload.sub, email: payload.email };
  }
}
