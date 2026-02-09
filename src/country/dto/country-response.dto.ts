import { Expose, Type } from 'class-transformer';
import { CityResponseDto } from 'src/city/dto/city-response.dto';

export class CountryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => CityResponseDto)
  cities?: CityResponseDto[];

  @Expose()
  citiesCount?: number;
}
