import { Expose, Type } from 'class-transformer';

export class ArticleNatureResponseDto {
  @Expose()
  id: string;

  @Expose()
  code: string;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  articlesCount?: number;
} 