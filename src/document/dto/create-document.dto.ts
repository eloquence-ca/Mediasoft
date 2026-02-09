import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateItemDocumentDto } from './create-item-document.dto';
import { CreateComponentDocumentDto } from './create-component.dto';
import { DOCUMENT_STATE, DOCUMENT_TYPE } from '../enum';

export class CreateDocumentDto {
  @IsUUID()
  @IsOptional()
  idCompany: string;

  @IsUUID()
  @IsOptional()
  idType: string;

  @IsUUID()
  @IsOptional()
  idConditionRegulation: string;

  @IsOptional()
  codeType: DOCUMENT_TYPE;

  @IsUUID()
  @IsOptional()
  idState: string;

  @IsOptional()
  codeState: DOCUMENT_STATE;

  @IsUUID()
  idCustomer: string;

  @IsUUID()
  idBillingAddress: string;

  @IsUUID()
  @IsOptional()
  idWorkAddress?: string;

  @IsUUID()
  @IsOptional()
  idTvaRate?: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  tariffCategory: string;

  @IsString()
  @IsOptional()
  customerReference?: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  validityDate?: Date;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date: Date;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  dueDate?: Date;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  reminderDate?: Date;

  @IsNumber()
  totalHT: number;

  @IsNumber()
  totalTVA: number;

  @IsNumber()
  totalTTC: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDocumentDto)
  items: CreateItemDocumentDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateComponentDocumentDto)
  components: CreateComponentDocumentDto[];
}
