import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentType } from './document-type.entity';
import { Document } from './document.entity';
import { DOCUMENT_STATE } from '../enum';

@Entity('document_states')
export class DocumentState {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'CODE', unique: true, length: 50 })
  code: DOCUMENT_STATE;

  @Column({ name: 'LABEL', length: 100 })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(
    () => DocumentType,
    (documentStatus) => documentStatus.documentStates,
  )
  @JoinTable({
    name: 'document_state_type_relations',
    joinColumn: {
      name: 'document_state_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'document_type_id',
      referencedColumnName: 'id',
    },
  })
  documentTypes: DocumentType[];

  @OneToMany(() => Document, (document) => document.state, {
    cascade: true,
  })
  documents: Document[];
}
