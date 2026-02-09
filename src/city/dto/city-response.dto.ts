import { Expose } from 'class-transformer';

export class CityResponseDto {
  @Expose()
  id: string;

  @Expose()
  idCountry: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  country?: any;
}
