import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsEmail,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { STATUS_CUSTOMER, TYPE_CUSTOMER } from '../entities/customer.entity';
import { Type } from 'class-transformer';
import { AddressDto } from 'src/address/dto/address.dto';
import { ContactDto } from 'src/contact/dto/contact.dto';
import { InternalNoteDto } from 'src/internal-note/dto/internal-note.dto';
import {
  CustomerIndividualDto,
  CustomerProfessionalDto,
  CustomerPublicEntityDto,
} from './create-customer.dto';

export class CreateCompleteCustomerDto {
  @IsUUID()
  idDirectory: string;

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
  @Type(() => AddressDto)
  headAddress?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsOptional()
  @IsBoolean()
  useSameAddressForBilling?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  workAddresses?: AddressDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts?: ContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InternalNoteDto)
  internalNotes?: InternalNoteDto[];

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
