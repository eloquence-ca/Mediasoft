import { IsNotEmpty, IsString, IsInt, Min } from 'class-validator';

export class CreateUnitDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  decimalPlaces: number;
}
