import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { Document } from 'src/document/entities/document.entity';
import { Project } from 'src/document/entities/project.entity';

@Entity('bill')
export class Bill {
  @PrimaryColumn('uuid', { name: 'ID_PAYMENT' })
  idPayment: string;

  @PrimaryColumn('uuid', { name: 'ID_DOCUMENT' })
  idDocument: string;

  @Column('uuid', { name: 'ID_PROJECT', nullable: true })
  idProject?: string | null;

  @Column('uuid', { name: 'ID_DOCUMENT_LINK', nullable: true })
  idDocumentLink: string;

  @Column({
    name: 'MONTANT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  montant: number;

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

  @ManyToOne(() => Payment, (payment) => payment.bills, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'ID_PAYMENT', referencedColumnName: 'id' })
  payment: Payment;

  @ManyToOne(() => Document, (document) => document.bills, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'ID_DOCUMENT', referencedColumnName: 'id' })
  document: Document;

  @OneToOne(() => Document, (link) => link.bill, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_DOCUMENT_LINK',
      referencedColumnName: 'id',
    },
  ])
  documentLink: Document;

  @ManyToOne(() => Project, (project) => project.bills, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_PROJECT',
      referencedColumnName: 'id',
    },
  ])
  project: Project;
}
