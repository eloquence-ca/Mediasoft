import { Module } from '@nestjs/common';
import { DocumentStatusService } from './document-status.service';
import { DocumentStatusController } from './document-status.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentStatusValueDoc } from './entities/document-status-value-doc.entity';
import { DocumentStatus } from './entities/document-status.entity';
import { DocumentStatusValue } from './entities/document-status-value.entity';
import { DocumentType } from 'src/document/entities/document-type.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentStatusValueDoc,
      DocumentStatus,
      DocumentStatusValue,
      DocumentType,
    ]),
  ],
  controllers: [DocumentStatusController],
  providers: [DocumentStatusService],
})
export class DocumentStatusModule {}
