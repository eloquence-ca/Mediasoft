import { IsOptional, IsString, IsUUID } from 'class-validator';

export class InternalNoteDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  description: string;
}
