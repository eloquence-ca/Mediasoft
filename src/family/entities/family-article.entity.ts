import { Exclude } from 'class-transformer';
import { ArticleEntity } from 'src/article/entities/article.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Family } from './family.entity';

@Entity('family_article')
export class FamilyArticle {
  @PrimaryColumn('uuid', { name: 'ARTICLE_ID' })
  articleId: string;

  @PrimaryColumn('uuid', { name: 'FAMILY_ID' })
  familyId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'ARTICLE_TENANT_ID' })
  articleTenantId: string;

  @PrimaryColumn('uuid', { name: 'FAMILY_TENANT_ID' })
  familyTenantId: string;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

  @ManyToOne(() => Family, (parent) => parent.familyArticles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'FAMILY_ID', referencedColumnName: 'familyId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'FAMILY_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  family: Family;

  @ManyToOne(() => ArticleEntity, (article) => article.familyArticles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'ARTICLE_ID', referencedColumnName: 'articleId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'ARTICLE_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  article: ArticleEntity;

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
