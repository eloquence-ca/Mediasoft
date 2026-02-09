import { ArticleEntity } from 'src/article/entities/article.entity';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import { UnitEntity } from 'src/unit/entities/unit.entity';
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
import { Document } from './document.entity';
import { ItemDocument } from './item-document.entity';

export enum TYPE_COMPONENT_DOCUMENT {
  ARTICLE = 'ARTICLE',
  OUVRAGE = 'OUVRAGE',
}

@Entity('component_documents')
export class ComponentDocument {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_DOCUMENT' })
  idDocument: string;

  @Column('uuid', { name: 'OUVRAGE_ID', nullable: true })
  ouvrageId: string;

  @Column('uuid', { name: 'OUVRAGE_CATALOG_ID', nullable: true })
  ouvrageCatalogId: string;

  @Column('uuid', { name: 'OUVRAGE_TENANT_ID', nullable: true })
  ouvrageTenantId: string;

  @Column('uuid', { name: 'ARTICLE_ID', nullable: true })
  articleId: string;

  @Column('uuid', { name: 'ARTICLE_CATALOG_ID', nullable: true })
  articleCatalogId: string;

  @Column('uuid', { name: 'ARTICLE_TENANT_ID', nullable: true })
  articleTenantId: string;

  @Column('uuid', { name: 'UNIT_ID', nullable: true })
  unitId: string;

  @Column('uuid', { name: 'SALE_UNIT_ID', nullable: true })
  saleUnitId: string;

  @Column('uuid', { name: 'PURCHASE_UNIT_ID', nullable: true })
  purchaseUnitId: string;

  @Column({
    name: 'TYPE',
    type: 'enum',
    enum: TYPE_COMPONENT_DOCUMENT,
    nullable: false,
  })
  type: TYPE_COMPONENT_DOCUMENT;

  @Column({ name: 'CODE', type: 'varchar', length: 50, nullable: true })
  code?: string | null;

  @Column({ name: 'NAME', type: 'varchar', length: 100, nullable: true })
  name?: string | null;

  @Column({ name: 'LABEL', type: 'varchar', length: 150, nullable: true })
  label?: string | null;

  @Column({ name: 'COMMERCIAL_DESCRIPTION', type: 'text', nullable: true })
  commercialDescription?: string | null;

  @Column({ name: 'PHOTO', type: 'varchar', length: 255, nullable: true })
  photo?: string | null;

  @Column({ name: 'NATURE', type: 'varchar', length: 255, nullable: true })
  nature?: string | null;

  @Column({
    name: 'MARGIN',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  margin?: number | null;

  @Column({
    name: 'DESIGNATION',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  designation?: string | null;

  @Column({
    name: 'CONVERSION_COEFFICIENT',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  conversionCoefficient?: number | null;

  @Column({
    name: 'SALE_PRICE_HT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  salePriceHT?: number | null;

  @Column({
    name: 'PRICE_OUVRAGE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  priceOuvrage?: number | null;

  @Column({
    name: 'SALE_PRICE_TTC',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  salePriceTTC?: number | null;

  @Column({
    name: 'PURCHASE_PRICE_HT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  purchasePriceHT?: number | null;

  @Column({
    name: 'PURCHASE_PRICE_TTC',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  purchasePriceTTC?: number | null;

  @Column({
    name: 'DATA',
    type: 'jsonb',
    nullable: true,
  })
  data: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Document, (type) => type.components, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_DOCUMENT',
      referencedColumnName: 'id',
    },
  ])
  document: Document;

  @OneToMany(() => ItemDocument, (item) => item.component, {
    cascade: true,
  })
  items: ItemDocument[];

  @ManyToOne(() => ArticleEntity, (article) => article.components, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
    nullable: true,
  })
  @JoinColumn([
    { name: 'ARTICLE_ID', referencedColumnName: 'articleId' },
    { name: 'ARTICLE_CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'ARTICLE_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  article?: ArticleEntity | null;

  @ManyToOne(() => Ouvrage, (ouvrage) => ouvrage.components, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
    nullable: true,
  })
  @JoinColumn([
    { name: 'OUVRAGE_ID', referencedColumnName: 'ouvrageId' },
    { name: 'OUVRAGE_CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'OUVRAGE_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  ouvrage?: Ouvrage | null;

  @ManyToOne(() => UnitEntity, (unit) => unit.components, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'UNIT_ID' })
  unit?: UnitEntity | null;

  @ManyToOne(() => UnitEntity, (unit) => unit.saleComponents, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'SALE_UNIT_ID' })
  saleUnit?: UnitEntity | null;

  @ManyToOne(() => UnitEntity, (unit) => unit.purchaseComponents, {
    onDelete: 'SET NULL',
    onUpdate: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'PURCHASE_UNIT_ID' })
  purchaseUnit?: UnitEntity | null;
}
