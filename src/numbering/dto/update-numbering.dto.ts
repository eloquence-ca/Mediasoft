import { PartialType } from '@nestjs/swagger';
import { CreateNumberingDto } from './create-numbering.dto';

export class UpdateNumberingDto extends PartialType(CreateNumberingDto) {}
