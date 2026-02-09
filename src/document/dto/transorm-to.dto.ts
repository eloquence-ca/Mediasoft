import { IsArray, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { DOCUMENT_TYPE } from '../enum';

export class TransformToDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @IsUUID()
  @IsOptional()
  @IsUUID('4', { each: true })
  idType: string;

  @IsOptional()
  codeType: DOCUMENT_TYPE;
}
