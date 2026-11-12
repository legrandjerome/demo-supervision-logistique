export type Role = 'ROLE_USER' | 'ROLE_OPERATOR' | 'ROLE_SUPERVISOR' | 'ROLE_ADMIN';

export interface User {
  readonly id: number;
  readonly email: string;
  readonly displayName: string;
  /** Rôles effectifs : la hiérarchie est résolue côté API. */
  readonly roles: readonly Role[];
}

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface LoginResponse {
  readonly token: string;
}
