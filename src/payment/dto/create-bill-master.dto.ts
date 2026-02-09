import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateBillMasterDto {
  @IsUUID()
  idCustomer: string;

  @IsOptional()
  @IsUUID()
  idPayment?: string;

  @IsUUID()
  @IsOptional()
  idDocument: string;

  @IsUUID()
  idPaymentMethod: string;

  @IsString()
  ref: string;

  @IsDateString()
  @IsOptional()
  date: Date;

  @IsDateString()
  @IsOptional()
  dueDate: Date;

  @IsDateString()
  @IsOptional()
  paymentDate: Date;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montant: number;
}
