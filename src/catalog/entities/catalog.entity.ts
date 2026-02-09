import { Exclude } from 'class-transformer';
import { ArticleEntity } from 'src/article/entities/article.entity';
import { Family } from 'src/family/entities/family.entity';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { CatalogCompany } from './catalog-company.entity';

@Entity('catalog')
export class CatalogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn({ name: 'TENANT_ID', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'DESCRIPTION', type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ name: 'NAME', type: 'varchar', length: 255, nullable: true })
  name: string | null;

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

  @ManyToOne(() => Tenant, (tenant) => tenant.catalogs)
  @JoinColumn({ name: 'TENANT_ID', referencedColumnName: 'id' })
  tenant: Tenant;

  @OneToMany(() => CatalogCompany, (catalogCompany) => catalogCompany.catalog)
  catalogCompanies: CatalogCompany[];

  @OneToMany(() => ArticleEntity, (article) => article.catalog)
  articles: ArticleEntity[];

  @OneToMany(() => Family, (family) => family.catalog)
  families: Family[];

  @OneToMany(() => Ouvrage, (ouvrage) => ouvrage.catalog)
  ouvrages: Ouvrage[];
}
