import { Customer } from 'src/customer/entities/customer.entity';
import { NumberingCustomer } from 'src/numbering/entities/numbering-customer.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
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
import { DirectoryCompany } from './directory-company.entity';

@Entity('directory')
export class Directory {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_TENANT' })
  idTenant: string;

  @Column({
    name: 'COMPANY_NAME',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

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

  @OneToOne(() => NumberingCustomer, (numbering) => numbering.customerDirectory)
  customerNumbering: NumberingCustomer;

  @ManyToOne(() => Tenant, (tenant) => tenant.directories, {
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

  @OneToMany(() => Customer, (customer) => customer.directory, {
    cascade: true,
  })
  customers: Customer[];

  @OneToMany(
    () => DirectoryCompany,
    (directoryCompany) => directoryCompany.directory,
    {
      cascade: true,
    },
  )
  directoryCompanies: DirectoryCompany[];
}
