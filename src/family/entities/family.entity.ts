import { Exclude } from 'class-transformer';
import { CatalogEntity } from 'src/catalog/entities/catalog.entity';
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
import { FamilyArticle } from './family-article.entity';
import { FamilyOuvrage } from './family-ouvrage.entity';

@Entity('family')
export class Family {
  @PrimaryGeneratedColumn('uuid', { name: 'FAMILY_ID' })
  familyId: string;

  @Column('uuid', { name: 'PARENT_ID', nullable: true })
  parentId: string | null;

  @Column('uuid', { name: 'PARENT_TENANT_ID', nullable: true })
  parentTenantId: string | null;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ID' })
  tenantId: string;

  @Column({ name: 'NAME', type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

  @ManyToOne(() => CatalogEntity, (catalog) => catalog.families, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  catalog: CatalogEntity;

  @ManyToOne(() => Family, (parent) => parent.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'PARENT_ID', referencedColumnName: 'familyId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'PARENT_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  parent: Family;

  @OneToMany(() => FamilyArticle, (familyArticle) => familyArticle.family, {
    cascade: true,
  })
  familyArticles: FamilyArticle[];

  @OneToMany(() => FamilyOuvrage, (familyOuvrage) => familyOuvrage.family, {
    cascade: true,
  })
  familyOuvrages: FamilyOuvrage[];

  @OneToMany(() => Family, (child) => child.parent, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  children: Family[];

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
}
