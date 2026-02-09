import {
  Controller
} from '@nestjs/common';
import { DocumentStatusService } from './document-status.service';

@Controller('document-status')
export class DocumentStatusController {
  constructor(private readonly documentStatusService: DocumentStatusService) {}
}
