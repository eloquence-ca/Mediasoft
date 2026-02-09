import { PartialType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { ContactDto } from './contact.dto';

export class CreateContactDto extends PartialType(ContactDto) {
  @IsUUID()
  idCustomer: string;
}
