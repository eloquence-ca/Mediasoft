import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { CreateBillMasterDto } from './create-bill-master.dto';

export class UpsertDocumentBillDto {
  @IsUUID()
  idDocument: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillMasterDto)
  bills?: CreateBillMasterDto[];
}
