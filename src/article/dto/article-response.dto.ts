import { Expose } from 'class-transformer';

export class ArticleResponseDto {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  label?: string;

  @Expose()
  commercialDescription?: string;

  @Expose()
  photo?: string;

  @Expose()
  lastPurchasePriceUpdateDate?: Date;

  @Expose()
  lastSellingPriceUpdateDate?: Date;

  @Expose()
  purchasePrice?: number;

  @Expose()
  margin?: number;

  @Expose()
  sellingPrice?: number;

  @Expose()
  conversionCoefficient?: number;

  @Expose()
  isDeleted: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  saleUnitId?: string;

  @Expose()
  purchaseUnitId?: string;

  @Expose()
  articleNatureId?: string;

  @Expose()
  catalogId?: string;

  @Expose()
  tenantId?: string;

  @Expose()
  familiesCount?: number;
}