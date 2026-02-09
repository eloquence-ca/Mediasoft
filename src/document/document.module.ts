import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressClone } from 'src/address-clone/entities/address-clone.entity';
import { Address } from 'src/address/entities/address.entity';
import { DocumentStatusValue } from 'src/document-status/entities/document-status-value.entity';
import { NumberingModule } from 'src/numbering/numbering.module';
import { PaymentModule } from 'src/payment/payment.module';
import { WorkflowModule } from 'src/workflow/workflow.module';
import { DocumentStateController } from './document-state.controller';
import { DocumentStateService } from './document-state.service';
import { DocumentTypeController } from './document-type.controller';
import { DocumentTypeService } from './document-type.service';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { ComponentDocument } from './entities/component-document.entity';
import { DocumentState } from './entities/document-state.entity';
import { DocumentType } from './entities/document-type.entity';
import { Document } from './entities/document.entity';
import { ItemDocument } from './entities/item-document.entity';
import { Project } from './entities/project.entity';
import { HtmlPdfGeneratorService } from './pdf-generator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentState,
      DocumentStatusValue,
      DocumentType,
      Document,
      ComponentDocument,
      ItemDocument,
      Address,
      AddressClone,
      Project,
    ]),
    WorkflowModule,
    PaymentModule,
    NumberingModule,
  ],
  controllers: [
    DocumentStateController,
    DocumentTypeController,
    DocumentController,
  ],
  providers: [
    DocumentStateService,
    DocumentTypeService,
    DocumentService,
    HtmlPdfGeneratorService,
  ],
  exports: [
    DocumentStateService,
    DocumentTypeService,
    DocumentService,
    HtmlPdfGeneratorService,
  ],
})
export class DocumentModule {}
