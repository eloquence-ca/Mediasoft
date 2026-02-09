import { USER_AUTH_TYPE, CIVILITY, USER_STATUS } from '../enum';
import { Exclude, Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  idTenant: string;

  @Expose()
  email: string;

  @Expose()
  slug: string;

  @Expose()
  firstname: string;

  @Expose()
  lastname: string;

  @Expose()
  phone: string;

  @Expose()
  cellPhone: string;

  @Expose()
  civility: CIVILITY;

  @Expose()
  isAdmin: boolean;

  @Expose()
  timezone: string;

  @Expose()
  preferences: Record<string, any>;

  @Expose()
  emailVerified: boolean;

  @Expose()
  status: USER_STATUS;

  @Expose()
  authType: USER_AUTH_TYPE;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  tenant?: any;

  @Expose()
  @Type(() => Object)
  userCompanies?: any[];

  @Exclude()
  pwd: string;

  @Exclude()
  emailVerifiedAt: Date;

  @Exclude()
  lastLoginAt: Date;

  @Exclude()
  otp: string;

  @Exclude()
  otpRole: any;

  @Exclude()
  otpTimeGenerate: Date;
}
