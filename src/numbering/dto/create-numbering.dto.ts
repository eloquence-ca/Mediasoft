import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateNumberingDto {
  @IsOptional()
  @IsUUID()
  idCustomerDirectory?: string;

  @IsString()
  @MaxLength(255)
  format: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  counter?: number = 0;
}
