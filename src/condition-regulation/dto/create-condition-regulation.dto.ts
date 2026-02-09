import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConditionRegulationDto {
  @IsString()
  @MaxLength(255)
  label: string;

  @IsString()
  @MaxLength(255)
  code: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  @Max(100)
  rate: number;
}
