import { Address } from 'src/address/entities/address.entity';
import { CatalogCompany } from 'src/catalog/entities/catalog-company.entity';
import { DirectoryCompany } from 'src/directory/entities/directory-company.entity';
import { Document } from 'src/document/entities/document.entity';
import { NumberingDocument } from 'src/numbering/entities/numbering-document.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { UserCompany } from 'src/user/entities/user-company.entity';
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
import { LEGAL_STATUS } from '../enum';
import { Project } from 'src/document/entities/project.entity';

export enum COMPANY_STATUS {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_BILLING_ADDRESS', nullable: true })
  idBillingAddress: string | null;

  @Column('uuid', { name: 'ID_HEAD_OFFICE_ADDRESS', nullable: true })
  idHeadOffice: string | null;

  @Column('uuid', { name: 'ID_TENANT' })
  idTenant: string;

  @Column({ name: 'NAME', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({
    name: 'NUM_TVA_INTRACOMMUNAUTAIRE',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  NumTvaIntracommunautaire: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: COMPANY_STATUS,
    default: COMPANY_STATUS.ACTIVE,
    nullable: false,
  })
  status: COMPANY_STATUS;

  @Column({
    name: 'LEGAL_STATUS',
    type: 'enum',
    enum: LEGAL_STATUS,
    nullable: true,
  })
  legalStatus: LEGAL_STATUS;

  @Column({ name: 'START_DATE_TRIAL', type: 'timestamptz', nullable: true })
  startDateTrial: Date;

  @Column({ name: 'END_DATE_TRIAL', type: 'timestamptz', nullable: true })
  endDateTrial: Date;

  @Column({
    name: 'TIMESTAMP',
    type: 'bigint',
    nullable: false,
    default: () => 'EXTRACT(EPOCH FROM NOW()) * 1000',
  })
  timestamp: number;

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

  @OneToOne(() => Address, (billingAddress) => billingAddress.companyBilling, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_BILLING_ADDRESS',
      referencedColumnName: 'id',
    },
  ])
  billingAddress?: Address;

  @OneToOne(() => Address, (headOffice) => headOffice.companyHeadOffice, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_HEAD_OFFICE_ADDRESS',
      referencedColumnName: 'id',
    },
  ])
  headOffice?: Address;

  @OneToMany(() => UserCompany, (userCompany) => userCompany.company, {
    cascade: true,
  })
  userCompanies: UserCompany[];

  @ManyToOne(() => Tenant, (tenant) => tenant.companies, {
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

  @OneToMany(() => Document, (document) => document.company, {
    cascade: true,
  })
  documents: Document[];

  @OneToMany(() => Project, (project) => project.company, {
    cascade: true,
  })
  projects: Project[];

  @OneToMany(
    () => DirectoryCompany,
    (directoryCompany) => directoryCompany.company,
    {
      cascade: true,
    },
  )
  directoryCompanies: DirectoryCompany[];

  @OneToMany(() => CatalogCompany, (catalogCompany) => catalogCompany.company, {
    cascade: true,
  })
  catalogCompanies: CatalogCompany[];

  @OneToMany(() => NumberingDocument, (numbering) => numbering.company, {
    cascade: true,
  })
  numberings: NumberingDocument[];
}
