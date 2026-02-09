import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class CityImportDto {
  @IsString()
  name: string;

  @IsString()
  code: string;
}

export class BulkCreateCitiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CityImportDto)
  cities: CityImportDto[];
}
