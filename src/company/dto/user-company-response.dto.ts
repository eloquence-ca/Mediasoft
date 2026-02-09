import { Expose } from 'class-transformer';

export class UserCompanyResponseDto {
  @Expose()
  idCompany: string;

  @Expose()
  idUser: string;

  @Expose()
  isAdmin: boolean;

  @Expose()
  user?: any;

  @Expose()
  company?: any;
}