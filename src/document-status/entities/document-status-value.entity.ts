import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DocumentStatus } from './document-status.entity';
import { DocumentStatusValueDoc } from './document-status-value-doc.entity';
import { DOCUMENT_STATUS_VALUE } from '../group';

@Entity('document-status-value')
export class DocumentStatusValue {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_DOCUMENT_STATUS' })
  idDocumentStatus: string;

  @Column({ name: 'CODE', unique: true, length: 50 })
  code: DOCUMENT_STATUS_VALUE;

  @Column({ name: 'LABEL', length: 100 })
  label: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => DocumentStatus, (documentStatus) => documentStatus.values, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_DOCUMENT_STATUS',
      referencedColumnName: 'id',
    },
  ])
  documentStatus: DocumentStatus;

  @OneToMany(() => DocumentStatusValueDoc, (item) => item.documentStatus, {
    cascade: true,
  })
  documentStatusValueDocs: DocumentStatusValueDoc[];
}
