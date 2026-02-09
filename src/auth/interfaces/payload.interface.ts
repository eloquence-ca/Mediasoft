export enum TOKEN_ROLE {
  AUTH = 'AUTH',
}

export interface JwtPayload {
  email: string;
  role: TOKEN_ROLE;
  sub?: string;
}