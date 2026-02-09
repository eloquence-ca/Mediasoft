import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CustomerIndividual } from './customer-individual.entity';
import { CustomerProfessional } from './customer-professional.entity';
import { CustomerPublicEntity } from './customer-public-entity.entity';
import { Contact } from 'src/contact/entities/contact.entity';
import { ConditionRegulation } from 'src/condition-regulation/entities/condition-regulation.entity';
import { TvaRate } from 'src/tva-rate/entities/tva-rate.entity';
import { InternalNote } from 'src/internal-note/entities/internal-note.entity';
import { Address } from 'src/address/entities/address.entity';
import { Directory } from 'src/directory/entities/directory.entity';
import { Document } from 'src/document/entities/document.entity';
import { Payment } from 'src/payment/entities/payment.entity';

export enum TYPE_CUSTOMER {
  PROFESSIONAL = 'PROFESSIONAL',
  INDIVIDUAL = 'INDIVIDUAL',
  PUBLIC_ENTITY = 'PUBLIC_ENTITY',
}

export enum STATUS_CUSTOMER {
  PROSPECT = 'PROSPECT',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  EMPLOYEE = 'EMPLOYEE',
  SYNDIC_DONOR = 'SYNDIC_DONOR',
}

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_DIRECTORY' })
  idDirectory: string;

  @Column('uuid', { name: 'ID_BILLING_ADDRESS', nullable: true })
  idBillingAddress: string;

  @Column('uuid', { name: 'ID_HEAD_ADDRESS', nullable: true })
  idHeadAddress: string;

  @Column('uuid', { name: 'ID_CONDITION_REGULATION', nullable: true })
  idConditionRegulation: string;

  @Column('uuid', { name: 'ID_TVA_RATE', nullable: true })
  idTvaRate: string;

  @Column({ name: 'CODE', type: 'varchar', length: 255, nullable: false })
  code: string;

  @Column({
    name: 'EMAIL',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email: string;

  @Column({ name: 'PHONE', type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ name: 'ORIGINE', type: 'varchar', length: 255, nullable: true })
  origine: string;

  @Column({
    name: 'TYPE_CUSTOMER',
    type: 'enum',
    enum: TYPE_CUSTOMER,
  })
  type: TYPE_CUSTOMER;

  @Column({
    name: 'STATUS_CUSTOMER',
    type: 'enum',
    enum: STATUS_CUSTOMER,
  })
  status: STATUS_CUSTOMER;

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

  @OneToOne(() => CustomerIndividual, (individual) => individual.customer)
  individual: CustomerIndividual;

  @OneToOne(() => CustomerProfessional, (professional) => professional.customer)
  professional: CustomerProfessional;

  @OneToOne(() => CustomerPublicEntity, (publicEntity) => publicEntity.customer)
  publicEntity: CustomerPublicEntity;

  @ManyToOne(() => ConditionRegulation, (condition) => condition.customers, {
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

  @ManyToOne(() => TvaRate, (tvaRate) => tvaRate.customers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_TVA_RATE',
      referencedColumnName: 'id',
    },
  ])
  tvaRate: TvaRate;

  @OneToOne(() => Address, (billingAddress) => billingAddress.customerBilling, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_BILLING_ADDRESS',
      referencedColumnName: 'id',
    },
  ])
  billingAddress: Address;

  @OneToOne(() => Address, (headAddress) => headAddress.customerHead, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_HEAD_ADDRESS',
      referencedColumnName: 'id',
    },
  ])
  headAddress: Address;

  @ManyToOne(() => Directory, (directory) => directory.customers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_DIRECTORY',
      referencedColumnName: 'id',
    },
  ])
  directory: Directory;

  @OneToMany(() => Contact, (contact) => contact.customer, {
    cascade: true,
  })
  contacts: Contact[];

  @OneToMany(() => Document, (document) => document.customer, {
    cascade: true,
  })
  documents: Document[];

  @OneToMany(() => Payment, (payment) => payment.customer, {
    cascade: true,
  })
  payments: Payment[];

  @OneToMany(() => InternalNote, (note) => note.customer, {
    cascade: true,
  })
  internalNotes: InternalNote[];

  @OneToMany(() => Address, (address) => address.customer, {
    cascade: true,
  })
  workAddresses: Address[];
}
