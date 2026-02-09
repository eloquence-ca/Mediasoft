import {
  IsUUID,
  IsEmail,
  IsString,
  IsBoolean,
  IsEnum,
  IsObject,
  IsDate,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CIVILITY } from 'src/user/enum';

export class UserEventDto {
  @IsUUID()
  id: string;

  @IsUUID()
  idTenant: string;

  @IsEmail()
  email: string;

  @IsString()
  slug: string;

  @IsString()
  firstname: string;

  @IsString()
  lastname: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cellPhone?: string;

  @IsBoolean()
  isAdmin: boolean;

  @IsOptional()
  @IsEnum(CIVILITY)
  civility?: CIVILITY;

  @IsString()
  timezone: string;

  @IsObject()
  preferences: Record<string, any>;

  @IsBoolean()
  emailVerified: boolean;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  @IsInt()
  timestamp: number;

  @IsString()
  targetGrappeId: string;
}
