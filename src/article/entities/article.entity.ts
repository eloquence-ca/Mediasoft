import { Exclude } from 'class-transformer';
import { ArticleNature } from 'src/article-nature/entities/article-nature.entity';
import { CatalogEntity } from 'src/catalog/entities/catalog.entity';
import { ComponentDocument } from 'src/document/entities/component-document.entity';
import { FamilyArticle } from 'src/family/entities/family-article.entity';
import { LigneOuvrageArticle } from 'src/ligne-ouvrage/entities/ligne-ouvrage-article.entity';
import { UnitEntity } from 'src/unit/entities/unit.entity';

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

@Entity('article')
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ARTICLE_ID' })
  articleId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ID' })
  tenantId: string;

  @Column({ name: 'ARTICLE_NATURE_ID', type: 'uuid', nullable: true })
  articleNatureId: string | null;

  @Column({ name: 'SALE_UNIT_ID', type: 'uuid', nullable: true })
  saleUnitId: string | null;

  @Column({ name: 'PURCHASE_UNIT_ID', type: 'uuid', nullable: true })
  purchaseUnitId: string | null;

  @Column({ name: 'CODE', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'NAME', type: 'varchar', length: 100, nullable: true })
  name: string | null;

  @Column({ name: 'LABEL', type: 'varchar', length: 150, nullable: true })
  label: string | null;

  @Column({ name: 'COMMERCIAL_DESCRIPTION', type: 'text', nullable: true })
  commercialDescription: string | null;

  @Column({ name: 'PHOTO', type: 'varchar', length: 255, nullable: true })
  photo: string | null;

  @Column({
    name: 'LAST_PURCHASE_PRICE_UPDATE_DATE',
    type: 'timestamp',
    nullable: true,
  })
  lastPurchasePriceUpdateDate: Date | null;

  @Column({
    name: 'LAST_SELLING_PRICE_UPDATE_DATE',
    type: 'timestamp',
    nullable: true,
  })
  lastSellingPriceUpdateDate: Date | null;

  @Column({
    name: 'PURCHASE_PRICE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  purchasePrice: number | null;

  @Column({
    name: 'MARGIN',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  margin: number | null;

  @Column({
    name: 'SELLING_PRICE',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  sellingPrice: number | null;

  @Column({
    name: 'CONVERSION_COEFFICIENT',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  conversionCoefficient: number | null;

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

  @ManyToOne(() => UnitEntity, (unit) => unit.saleArticles, {
    nullable: true,
  })
  @JoinColumn({ name: 'SALE_UNIT_ID' })
  saleUnit: UnitEntity | null;

  @ManyToOne(() => UnitEntity, (unit) => unit.purchaseArticles, {
    nullable: true,
  })
  @JoinColumn({ name: 'PURCHASE_UNIT_ID' })
  purchaseUnit: UnitEntity | null;

  @ManyToOne(() => ArticleNature, (articleNature) => articleNature.articles, {
    nullable: true,
  })
  @JoinColumn({ name: 'ARTICLE_NATURE_ID' })
  articleNature: ArticleNature | null;

  @ManyToOne(() => CatalogEntity, (catalog) => catalog.articles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  catalog: CatalogEntity;

  @OneToMany(() => FamilyArticle, (familyArticle) => familyArticle.article, {
    cascade: true,
  })
  familyArticles: FamilyArticle[];

  @OneToMany(() => LigneOuvrageArticle, (ligne) => ligne.article)
  lignesOuvrageArticle: LigneOuvrageArticle[];

  @OneToMany(() => ComponentDocument, (component) => component.article)
  components: ComponentDocument[];
}
