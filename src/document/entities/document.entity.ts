import { AddressClone } from 'src/address-clone/entities/address-clone.entity';
import { Company } from 'src/company/entities/company.entity';
import { ConditionRegulation } from 'src/condition-regulation/entities/condition-regulation.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { DocumentStatusValueDoc } from 'src/document-status/entities/document-status-value-doc.entity';
import { Bill } from 'src/payment/entities/bill.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TvaRate } from 'src/tva-rate/entities/tva-rate.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { ComponentDocument } from './component-document.entity';
import { DocumentState } from './document-state.entity';
import { DocumentType } from './document-type.entity';
import { ItemDocument } from './item-document.entity';
import { Project } from './project.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_TENANT' })
  idTenant: string;

  @Column('uuid', { name: 'ID_COMPANY', nullable: true })
  idCompany?: string | null;

  @Column('uuid', { name: 'ID_PROJECT', nullable: true })
  idProject?: string | null;

  @Column('uuid', { name: 'ID_CREATED_BY' })
  idCreatedBy: string;

  @Column('uuid', { name: 'ID_UPDATED_BY' })
  idUpdatedBy: string;

  @Column('uuid', { name: 'ID_TYPE' })
  idType: string;

  @Column('uuid', { name: 'ID_STATE' })
  idState: string;

  @Column('uuid', { name: 'ID_CUSTOMER' })
  idCustomer: string;

  @Column('uuid', { name: 'ID_BILLING_ADDRESS' })
  idBillingAddress: string;

  @Column('uuid', { name: 'ID_WORK_ADDRESS', nullable: true })
  idWorkAddress?: string | null;

  @Column('uuid', { name: 'ID_TVA_RATE', nullable: true })
  idTvaRate: string;

  @Column('uuid', { name: 'ID_CONDITION_REGULATION', nullable: true })
  idConditionRegulation: string;

  @Column({ name: 'CODE', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'TITLE', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'DESCRIPTION', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'IS_DELETED', type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ name: 'LOCKED', type: 'boolean', default: false })
  locked: boolean;

  @Column({ name: 'TARIFF_CATEGORY', type: 'varchar', length: 255 })
  tariffCategory: string;

  @Column({
    name: 'DATE',
    type: 'timestamp',
    nullable: true,
  })
  date: Date;

  @Column({
    name: 'VALIDITY_DATE',
    type: 'timestamp',
    nullable: true,
  })
  validityDate?: Date;

  @Column({
    name: 'DUE_DATE',
    type: 'timestamp',
    nullable: true,
  })
  dueDate?: Date;

  @Column({
    name: 'REMINDER_DATE',
    type: 'timestamp',
    nullable: true,
  })
  reminderDate?: Date;

  @Column({
    name: 'TOTAL_HT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  totalHT: number;

  @Column({
    name: 'TOTAL_TVA',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  totalTVA: number;

  @Column({
    name: 'TOTAL_TTC',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  totalTTC: number;

  @Column({
    name: 'AMOUNT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  amount?: number | null;

  @Column({
    name: 'DATA',
    type: 'jsonb',
    nullable: true,
  })
  data: Record<string, any>;

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

  @ManyToOne(() => DocumentType, (type) => type.documents, {
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

  @ManyToOne(() => DocumentState, (state) => state.documents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_STATE',
      referencedColumnName: 'id',
    },
  ])
  state: DocumentState;

  @ManyToOne(() => Company, (company) => company.documents, {
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

  @ManyToOne(() => Tenant, (tenant) => tenant.documents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_TENANT',
      referencedColumnName: 'id',
    },
  ])
  tenant: Tenant;

  @ManyToOne(() => Customer, (customer) => customer.documents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CUSTOMER',
      referencedColumnName: 'id',
    },
  ])
  customer: Customer;

  @OneToOne(() => AddressClone, (address) => address.documentBilling, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_BILLING_ADDRESS',
      referencedColumnName: 'id',
    },
  ])
  billingAddress: AddressClone;

  @OneToOne(() => AddressClone, (address) => address.documentWork, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn([
    {
      name: 'ID_WORK_ADDRESS',
      referencedColumnName: 'id',
    },
  ])
  workAddress: AddressClone;

  @ManyToOne(() => TvaRate, (tvaRate) => tvaRate.documents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn([
    {
      name: 'ID_TVA_RATE',
      referencedColumnName: 'id',
    },
  ])
  tvaRate: TvaRate;

  @OneToMany(() => ItemDocument, (item) => item.document, {
    cascade: true,
  })
  items: ItemDocument[];

  @OneToMany(() => ComponentDocument, (component) => component.document, {
    cascade: true,
  })
  components: ComponentDocument[];

  @ManyToOne(() => Project, (project) => project.documents, {
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

  @ManyToOne(() => User, (user) => user.documentsCreated, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CREATED_BY',
      referencedColumnName: 'id',
    },
  ])
  createdBy: User;

  @ManyToOne(() => User, (user) => user.documentsUpdated, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_UPDATED_BY',
      referencedColumnName: 'id',
    },
  ])
  updatedBy: User;

  @ManyToOne(() => ConditionRegulation, (condition) => condition.documents, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CONDITION_REGULATION',
      referencedColumnName: 'id',
    },
  ])
  conditionRegulation: ConditionRegulation;

  @OneToOne(() => Bill, (bill) => bill.documentLink)
  bill: Bill;

  @OneToMany(() => Bill, (bill) => bill.document, {
    cascade: true,
  })
  bills: Bill[];

  @ManyToMany(() => Document, (document) => document.children)
  @JoinTable({
    name: 'document_source',
    joinColumn: {
      name: 'ID_PARENT',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'ID_CHILD',
      referencedColumnName: 'id',
    },
  })
  parents: Document[];

  @ManyToMany(() => Document, (document) => document.parents)
  children: Document[];

  @OneToMany(() => DocumentStatusValueDoc, (item) => item.document, {
    cascade: true,
  })
  status: DocumentStatusValueDoc[];

  availableStates: DocumentState[];
  billsAmount?: number;
  netToPay?: number;
  invoices: Document[];
}
