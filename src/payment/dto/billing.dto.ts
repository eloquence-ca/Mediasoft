import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class BillingDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @IsUUID()
  idPaymentMethod: string;
}
