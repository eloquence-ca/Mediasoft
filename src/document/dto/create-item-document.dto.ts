import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TYPE_ITEM_DOCUMENT } from '../entities/item-document.entity';
import { Type } from 'class-transformer';

export class CreateItemDocumentDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  @IsOptional()
  idComponent?: string;

  @IsString()
  @IsOptional()
  refComponent?: string;

  @IsUUID()
  @IsOptional()
  idParent?: string;

  @IsUUID()
  @IsOptional()
  idTvaRate: string;

  @IsNumber()
  position: number;

  @IsEnum(TYPE_ITEM_DOCUMENT)
  type: TYPE_ITEM_DOCUMENT;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  totalHT?: number;

  @IsNumber()
  @IsOptional()
  totalTVA?: number;

  @IsNumber()
  @IsOptional()
  totalTTC?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDocumentDto)
  @IsOptional()
  children?: CreateItemDocumentDto[];
}
