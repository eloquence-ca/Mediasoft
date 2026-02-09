import { Expose, Type } from 'class-transformer';
import { CompanyResponseDto } from 'src/company/dto/company-response.dto';
import { JobResponseDto } from 'src/job/dto/job-response.dto';
import { ArticleResponseDto } from 'src/article/dto/article-response.dto';
import { FamilyResponseDto } from 'src/family/dto/family-response.dto';
import { OuvrageResponseDto } from 'src/ouvrage/dto/ouvrage-response.dto';

export class CatalogResponseDto {
  @Expose()
  id: string;

  @Expose()
  description: string;

  @Expose()
  name: string;

  @Expose()
  tenantId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  companiesCount?: number;

  @Expose()
  @Type(() => CompanyResponseDto)
  companies?: CompanyResponseDto[];

  @Expose()
  jobsCount?: number;

  @Expose()
  @Type(() => JobResponseDto)
  jobs?: JobResponseDto[];

  @Expose()
  articlesCount?: number;

  @Expose()
  @Type(() => ArticleResponseDto)
  articles?: ArticleResponseDto[];

  @Expose()
  familiesCount?: number;

  @Expose()
  @Type(() => FamilyResponseDto)
  families?: FamilyResponseDto[];

  @Expose()
  ouvragesCount?: number;

  @Expose()
  @Type(() => OuvrageResponseDto)
  ouvrages?: OuvrageResponseDto[];
}