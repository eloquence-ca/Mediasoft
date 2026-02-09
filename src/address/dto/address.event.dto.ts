import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
} from 'class-validator';

export class AddressEventDto {
  @IsUUID()
  id?: string;

  @IsUUID()
  @IsOptional()
  idCity?: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsOptional()
  trackNum?: number;

  @IsString()
  @IsOptional()
  trackName?: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsOptional()
  countryName?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}
