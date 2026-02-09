import { Expose } from 'class-transformer';

export class UnitResponseDto {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  label: string;

  @Expose()
  decimalPlaces: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  saleArticlesCount?: number;

  @Expose()
  purchaseArticlesCount?: number;
}
