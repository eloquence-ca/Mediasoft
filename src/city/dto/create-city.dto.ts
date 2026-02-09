import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCityDto {
  @IsUUID()
  @IsNotEmpty()
  idCountry: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}
