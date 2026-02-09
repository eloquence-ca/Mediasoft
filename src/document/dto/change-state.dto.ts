import { IsArray, IsOptional, IsUUID } from 'class-validator';
import { DOCUMENT_STATE } from '../enum';

export class ChangeStateDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];

  @IsUUID()
  @IsOptional()
  idState: string;

  @IsOptional()
  codeState: DOCUMENT_STATE;
}
