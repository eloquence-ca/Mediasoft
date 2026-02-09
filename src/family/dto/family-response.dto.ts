import { Expose, Type } from 'class-transformer';
import { ArticleResponseDto } from '../../article/dto/article-response.dto';
import { OuvrageResponseDto } from '../../ouvrage/dto/ouvrage-response.dto';

export class FamilyResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  catalogId: string;

  @Expose()
  tenantId?: string;

  @Expose()
  parentId?: string;

  @Expose()
  articlesCount?: number;

  @Expose()
  @Type(() => ArticleResponseDto)
  articles?: ArticleResponseDto[];

  @Expose()
  ouvragesCount?: number;

  @Expose()
  @Type(() => OuvrageResponseDto)
  ouvrages?: OuvrageResponseDto[];

  @Expose()
  childrenCount?: number;

  @Expose()
  @Type(() => FamilyResponseDto)
  children?: FamilyResponseDto[];
}