import { IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class InvoiceDto {
  @IsOptional()
  @IsUUID('4')
  idPayment: string;

  @IsUUID('4')
  idDocument: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}
