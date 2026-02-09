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
import { DocumentStatusValue } from './document-status-value.entity';
import { DocumentType } from 'src/document/entities/document-type.entity';
import { DocumentStatusValueDoc } from './document-status-value-doc.entity';
import { DOCUMENT_STATUS } from '../group';

@Entity('document-status')
export class DocumentStatus {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_TYPE', nullable: true })
  idType: string;

  @Column({ name: 'CODE', unique: true, length: 50 })
  code: DOCUMENT_STATUS;

  @Column({ name: 'LABEL', length: 100 })
  label: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => DocumentStatusValue, (value) => value.documentStatus, {
    cascade: true,
  })
  values: DocumentStatusValue[];

  @OneToMany(() => DocumentStatusValueDoc, (item) => item.documentStatus, {
    cascade: true,
  })
  documentStatusValueDocs: DocumentStatusValueDoc[];

  @ManyToOne(() => DocumentType, (type) => type.documentStatus, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_TYPE',
      referencedColumnName: 'id',
    },
  ])
  type: DocumentType;
}
