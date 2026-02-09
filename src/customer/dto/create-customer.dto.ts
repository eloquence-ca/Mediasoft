import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { STATUS_CUSTOMER, TYPE_CUSTOMER } from '../entities/customer.entity';
import { CIVILITY } from 'src/user/enum';
import { LEGAL_STATUS } from 'src/company/enum';
import { Type } from 'class-transformer';

export class CustomerIndividualDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstname: string;

  @IsString()
  @MaxLength(255)
  lastname: string;

  @IsOptional()
  @IsEnum(CIVILITY)
  civility?: CIVILITY;
}

export class CustomerProfessionalDto {
  @IsString()
  @MaxLength(255)
  companyName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tvaIntracommunautaire?: string;

  @IsOptional()
  @IsEnum(LEGAL_STATUS)
  legalStatus?: LEGAL_STATUS;
}

export class CustomerPublicEntityDto {
  @IsString()
  @MaxLength(255)
  entityName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  siret?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chorusCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  chorusRecipient?: string;
}

export class CreateCustomerDto {
  @IsUUID()
  idDirectory: string;

  @IsOptional()
  @IsUUID()
  idBillingAddress?: string;

  @IsOptional()
  @IsUUID()
  idHeadAddress?: string;

  @IsOptional()
  @IsUUID()
  idConditionRegulation?: string;

  @IsOptional()
  @IsUUID()
  idTvaRate?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  origine?: string;

  @IsEnum(TYPE_CUSTOMER)
  type: TYPE_CUSTOMER;

  @IsEnum(STATUS_CUSTOMER)
  status: STATUS_CUSTOMER;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerIndividualDto)
  individual?: CustomerIndividualDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerProfessionalDto)
  professional?: CustomerProfessionalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerPublicEntityDto)
  publicEntity?: CustomerPublicEntityDto;
}
