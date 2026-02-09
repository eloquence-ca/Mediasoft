import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentStatus } from './document-status.entity';
import { Document } from 'src/document/entities/document.entity';
import { DocumentStatusValue } from './document-status-value.entity';

@Entity('document-status_value_doc')
export class DocumentStatusValueDoc {
  @PrimaryColumn('uuid', { name: 'ID_DOCUMENT_STATUS' })
  idDocumentStatus: string;

  @PrimaryColumn('uuid', { name: 'ID_DOCUMENT' })
  idDocument: string;

  @Column('uuid', { name: 'ID_VALUE' })
  idValue: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(
    () => DocumentStatus,
    (documentStatus) => documentStatus.documentStatusValueDocs,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn([
    {
      name: 'ID_DOCUMENT_STATUS',
      referencedColumnName: 'id',
    },
  ])
  documentStatus: DocumentStatus;

  @ManyToOne(() => Document, (document) => document.status, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_DOCUMENT',
      referencedColumnName: 'id',
    },
  ])
  document: Document;

  @ManyToOne(
    () => DocumentStatusValue,
    (value) => value.documentStatusValueDocs,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn([
    {
      name: 'ID_VALUE',
      referencedColumnName: 'id',
    },
  ])
  value: DocumentStatusValue;
}
