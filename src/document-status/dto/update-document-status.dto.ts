import { PartialType } from '@nestjs/swagger';
import { CreateDocumentStatusDto } from './create-document-status.dto';

export class UpdateDocumentStatusDto extends PartialType(CreateDocumentStatusDto) {}
