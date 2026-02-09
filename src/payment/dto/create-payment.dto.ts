import {
  IsUUID,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBillDto } from './create-bill.dto';

export class CreatePaymentDto {
  @IsUUID()
  idCustomer: string;

  @IsUUID()
  idPaymentMethod: string;

  @IsString()
  ref: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montant: number;

  @IsDateString()
  @IsOptional()
  date: Date;

  @IsDateString()
  @IsOptional()
  dueDate: Date;

  @IsDateString()
  @IsOptional()
  paymentDate: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillDto)
  bills?: CreateBillDto[];
}
