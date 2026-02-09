import { Exclude } from 'class-transformer';
import { Company } from 'src/company/entities/company.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CatalogEntity } from './catalog.entity';

@Entity('catalog_company')
export class CatalogCompany {
  @PrimaryColumn('uuid', { name: 'COMPANY_ID' })
  companyId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ID' })
  tenantId: string;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

  @CreateDateColumn({
    name: 'CREATION_DATE',
    type: 'timestamptz',
    nullable: false,
  })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_DATE',
    type: 'timestamptz',
    nullable: false,
  })
  @Exclude()
  updatedAt: Date;

  @ManyToOne(() => Company, (company) => company.catalogCompanies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'COMPANY_ID', referencedColumnName: 'id' }])
  company: Company;

  @ManyToOne(() => CatalogEntity, (catalog) => catalog.catalogCompanies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  catalog: CatalogEntity;
}
