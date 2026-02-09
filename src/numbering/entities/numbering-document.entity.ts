import { Company } from 'src/company/entities/company.entity';
import { DocumentType } from 'src/document/entities/document-type.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('numbering-document')
export class NumberingDocument {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_TYPE_DOCUMENT' })
  idTypeDocument: string;

  @Column('uuid', { name: 'ID_COMPANY' })
  idCompany: string;

  @Column({ name: 'FORMAT', type: 'varchar', length: 255, nullable: false })
  format: string;

  @Column({ name: 'COUNTER', type: 'int', default: 0, nullable: false })
  counter: number;

  @Column({ name: 'FINAL', type: 'boolean', default: false })
  final: boolean;

  @CreateDateColumn({
    name: 'CREATION_DATE',
    type: 'timestamptz',
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_DATE',
    type: 'timestamptz',
    nullable: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => DocumentType, (type) => type.numberings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_TYPE_DOCUMENT',
      referencedColumnName: 'id',
    },
  ])
  typeDocument: DocumentType;

  @ManyToOne(() => Company, (company) => company.numberings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_COMPANY',
      referencedColumnName: 'id',
    },
  ])
  company: Company;
}
