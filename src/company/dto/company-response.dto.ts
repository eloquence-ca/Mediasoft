import { Expose, Type } from 'class-transformer';
import { UserCompanyResponseDto } from './user-company-response.dto';

export class CompanyResponseDto {
  @Expose()
  id: string;

  @Expose()
  idTenant: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => UserCompanyResponseDto)
  userCompanies?: UserCompanyResponseDto[];

  @Expose()
  tenant?: any;

  @Expose()
  usersCount?: number;

  @Expose()
  adminsCount?: number;
}