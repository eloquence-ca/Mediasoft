import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateBillDto {
  @IsOptional()
  @IsUUID()
  idPayment?: string;

  @IsUUID()
  idDocument: string;

  @IsOptional()
  @IsUUID()
  idDocumentLink?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montant: number;
}
