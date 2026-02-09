import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentStatusValue } from './entities/document-status-value.entity';
import { DocumentStatus } from './entities/document-status.entity';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_VALUE, groups } from './group';
import { DocumentType } from 'src/document/entities/document-type.entity';
import { DOCUMENT_TYPE } from 'src/document/enum';

@Injectable()
export class DocumentStatusService implements OnModuleInit {
  private readonly logger = new Logger(DocumentStatusService.name);

  constructor(
    @InjectRepository(DocumentType)
    private readonly repoDocumentType: Repository<DocumentType>,
    @InjectRepository(DocumentStatus)
    private readonly repoDocumentStatus: Repository<DocumentStatus>,
    @InjectRepository(DocumentStatusValue)
    private readonly repoDocumentStatusValue: Repository<DocumentStatusValue>,
  ) {}

  async onModuleInit() {
    await this.initializeStatuses();
  }

  async initializeStatuses(): Promise<void> {
    this.logger.log('Initializing document statuses...');

    for (const group of groups) {
      const status = await this.saveDocumentStatus(
        group.type,
        group.status,
        group.label,
      );

      if (status) {
        for (const value of group.values) {
          await this.saveDocumentStatusValue(
            status.id,
            value.code,
            value.label,
          );
        }
      }
    }

    this.logger.log('Document status initialization completed');
  }

  async saveDocumentStatus(
    codeType: DOCUMENT_TYPE,
    code: DOCUMENT_STATUS,
    label: string,
  ): Promise<DocumentStatus | null> {
    const type = await this.repoDocumentType.findOne({
      where: { code: codeType },
    });

    if (!type) {
      return null;
    }

    const existing = await this.repoDocumentStatus.findOne({
      where: { code },
    });

    if (!existing) {
      const status = this.repoDocumentStatus.create({ code, label });
      status.type = type;
      const result = await this.repoDocumentStatus.save(status);
      this.logger.log(`Created document type: ${code}`);
      return result;
    } else {
      existing.label = label;
      await this.repoDocumentStatus.save(existing);
      this.logger.log(`update document status: ${code}`);
    }

    return existing;
  }

  async saveDocumentStatusValue(
    idDocumentStatus: string,
    code: DOCUMENT_STATUS_VALUE,
    label: string,
  ): Promise<void> {
    const existing = await this.repoDocumentStatusValue.findOne({
      where: { code },
    });

    if (!existing) {
      const value = this.repoDocumentStatusValue.create({
        idDocumentStatus,
        code,
        label,
      });
      await this.repoDocumentStatusValue.save(value);
      this.logger.log(`Created document type value: ${code}`);
    } else {
      existing.label = label;
      await this.repoDocumentStatusValue.save(existing);
      this.logger.log(`update document status value: ${code}`);
    }
  }
}
