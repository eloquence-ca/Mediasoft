import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TYPE_COMPONENT_DOCUMENT } from '../entities/component-document.entity';

export class CreateComponentDocumentDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  ref: string;

  @IsEnum(TYPE_COMPONENT_DOCUMENT)
  type: TYPE_COMPONENT_DOCUMENT;

  @IsUUID()
  @IsOptional()
  articleId?: string;

  @IsUUID()
  @IsOptional()
  ouvrageId?: string;

  @IsUUID()
  @IsOptional()
  unitId?: string;

  @IsUUID()
  @IsOptional()
  saleUnitId?: string;

  @IsUUID()
  @IsOptional()
  purchaseUnitId?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  commercialDescription?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsNumber()
  @IsOptional()
  margin?: number;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsNumber()
  @IsOptional()
  conversionCoefficient?: number;

  @IsNumber()
  salePriceHT: number;

  @IsNumber()
  priceOuvrage: number;

  @IsNumber()
  salePriceTTC: number;

  @IsNumber()
  purchasePriceHT: number;

  @IsNumber()
  purchasePriceTTC: number;
}
