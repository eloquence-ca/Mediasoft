import { IsUUID, IsBoolean, IsString, IsInt } from 'class-validator';

export class UserCompanyEventDto {
  @IsUUID()
  idCompany: string;

  @IsUUID()
  idUser: string;

  @IsInt()
  timestamp: number;

  @IsBoolean()
  isAdmin: boolean;

  @IsString()
  targetGrappeId: string;
}
