import { DocumentStatus } from 'src/document-status/entities/document-status.entity';
import { NumberingDocument } from 'src/numbering/entities/numbering-document.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DOCUMENT_TYPE } from '../enum';
import { DocumentState } from './document-state.entity';
import { Document } from './document.entity';

@Entity('document_types')
export class DocumentType {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'CODE', unique: true, length: 50 })
  code: DOCUMENT_TYPE;

  @Column({ name: 'LABEL', length: 100 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(
    () => DocumentState,
    (documentState) => documentState.documentTypes,
  )
  documentStates: DocumentState[];

  @OneToMany(() => Document, (document) => document.type, {
    cascade: true,
  })
  documents: Document[];

  @OneToMany(() => NumberingDocument, (numbering) => numbering.typeDocument, {
    cascade: true,
  })
  numberings: NumberingDocument[];

  @OneToMany(() => DocumentStatus, (documentStatus) => documentStatus.type, {
    cascade: true,
  })
  documentStatus: DocumentStatus[];
}
