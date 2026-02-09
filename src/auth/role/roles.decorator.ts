import { SetMetadata } from '@nestjs/common';

export enum ROLES {
  TENANT_USER = 'tenant_user',
  TENANT_ADMIN = 'tenant_admin',
  COMPANY_USER = 'company_user',
  COMPANY_ADMIN = 'company_admin',
}

export const ALL_ROLES = [ROLES.TENANT_USER, ROLES.TENANT_ADMIN];
export const ALL_COMPANY_ROLES = [ROLES.COMPANY_USER, ROLES.COMPANY_ADMIN];

export const Roles = (...roles: ROLES[]) => SetMetadata('roles', roles);
