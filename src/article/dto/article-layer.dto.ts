import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class ArticleLayerDto {
  @IsNotEmpty()
  @IsUUID()
  catalogId: string;

  @IsOptional()
  @IsUUID()
  articleId?: string;

  @IsOptional()
  @IsArray()
  // @IsUUID('4', { each: true })
  familyIds: string[];

  @IsOptional()
  @IsUUID()
  saleUnitId?: string;

  @IsOptional()
  @IsUUID()
  purchaseUnitId?: string;

  @IsOptional()
  @IsUUID()
  articleNatureId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  label: string | null;

  @IsOptional()
  @IsString()
  commercialDescription: string | null;

  @IsOptional()
  @IsString()
  photo: string | null;

  @IsOptional()
  @IsDateString()
  lastPurchasePriceUpdateDate: Date | null;

  @IsOptional()
  @IsDateString()
  lastSellingPriceUpdateDate: Date | null;

  @IsOptional()
  @IsNumber()
  purchasePrice: number | null;

  @IsOptional()
  @IsNumber()
  margin: number | null;

  @IsOptional()
  @IsNumber()
  sellingPrice: number | null;

  @IsOptional()
  @IsNumber()
  conversionCoefficient: number | null;
}
