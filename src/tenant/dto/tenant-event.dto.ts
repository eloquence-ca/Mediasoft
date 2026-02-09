import {
  IsObject,
  IsString,
  ValidateNested,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDate,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserEventDto } from 'src/user/dto/user-event.dto';
import { CompanyEventDto } from 'src/company/dto/company-event.dto';
import { TenantStatus } from '../entities/tenant.entity';
import { UserCompanyEventDto } from 'src/company/dto/user-company-event.dto';

export class TenantEventDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsInt()
  timestamp: number;

  @IsOptional()
  @IsString()
  domaine?: string;

  @IsEnum(TenantStatus)
  status: TenantStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTrial?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDateTrial?: Date;

  @IsString()
  targetGrappeId: string;

  @ValidateNested()
  @Type(() => UserEventDto)
  @IsObject()
  @IsOptional()
  owner?: UserEventDto;

  @ValidateNested()
  @Type(() => CompanyEventDto)
  @IsObject()
  @IsOptional()
  company?: CompanyEventDto;

  @ValidateNested()
  @Type(() => UserCompanyEventDto)
  @IsObject()
  @IsOptional()
  userCompany?: UserCompanyEventDto;
}
