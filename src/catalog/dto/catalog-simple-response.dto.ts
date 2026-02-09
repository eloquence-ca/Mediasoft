import { Expose, Type } from 'class-transformer';
import { FamilyResponseDto } from 'src/family/dto/family-response.dto';

export class CatalogSimpleResponseDto {
  @Expose()
  id: string;

  @Expose()
  catalogId: string;

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
  familiesCount?: number;

  @Expose()
  @Type(() => FamilyResponseDto)
  families?: FamilyResponseDto[];
}
