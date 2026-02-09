import { PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { InternalNoteDto } from './internal-note.dto';

export class CreateInternalNoteDto extends PartialType(InternalNoteDto) {
  @IsUUID()
  idCustomer: string;
}
