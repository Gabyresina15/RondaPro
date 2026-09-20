export interface TokenPayload {
  sub: string;
  email: string;
  role: 'auditor' | 'supervisor';
}

export interface TokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
