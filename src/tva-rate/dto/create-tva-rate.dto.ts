import { IsString, IsNumber, MaxLength, Min, Max } from 'class-validator';

export class CreateTvaRateDto {
  @IsString()
  @MaxLength(255)
  label: string;

  @IsString()
  @MaxLength(255)
  code: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  rate: number;
}