import { Expose } from 'class-transformer';

export class JobResponseDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  tenantsCount?: number;

  @Expose()
  catalogsCount?: number;
}