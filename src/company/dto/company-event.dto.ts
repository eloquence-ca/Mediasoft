import {
  IsUUID,
  IsString,
  IsEnum,
  IsDate,
  IsOptional,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { COMPANY_STATUS } from '../entities/company.entity';
import { LEGAL_STATUS } from '../enum';
import { AddressEventDto } from 'src/address/dto/address.event.dto';

export class CompanyEventDto {
  @IsUUID()
  id: string;

  @IsUUID()
  idTenant: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  NumTvaIntracommunautaire?: string;

  @IsEnum(COMPANY_STATUS)
  status: COMPANY_STATUS;

  @IsOptional()
  @IsEnum(LEGAL_STATUS)
  legalStatus?: LEGAL_STATUS;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTrial?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDateTrial?: Date;

  @Type(() => Date)
  @IsDate()
  createdAt: Date;

  @Type(() => Date)
  @IsDate()
  updatedAt: Date;

  billingAddress: AddressEventDto;

  headOffice: AddressEventDto;

  @IsInt()
  timestamp: number;

  @IsString()
  targetGrappeId: string;
}
