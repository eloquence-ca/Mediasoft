import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsDateString, IsArray, ArrayMinSize } from "class-validator";

export class CreateArticleDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  commercialDescription?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsDateString()
  lastPurchasePriceUpdateDate?: Date;

  @IsOptional()
  @IsDateString()
  lastSellingPriceUpdateDate?: Date;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  margin?: number;

  @IsOptional()
  @IsNumber()
  sellingPrice?: number;

  @IsOptional()
  @IsNumber()
  conversionCoefficient?: number;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

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
  @IsUUID()
  catalogId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  familyIds: string[];
}
