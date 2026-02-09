import { Exclude } from 'class-transformer';
import { ArticleEntity } from 'src/article/entities/article.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LigneOuvrage } from './ligne-ouvrage.entity';

@Entity('ligne-ouvrage_article')
export class LigneOuvrageArticle {
  @PrimaryGeneratedColumn('uuid', { name: 'LIGNE_OUVRAGE_ARICLE_ID' })
  ligneOuvrageArticleId: string;

  @PrimaryColumn('uuid', { name: 'LIGNE_OUVRAGE_ID' })
  ligneOuvrageId: string;

  @PrimaryColumn('uuid', { name: 'OUVRAGE_ID' })
  ouvrageId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ID' })
  tenantId: string;

  @PrimaryColumn('uuid', { name: 'ARTICLE_ID' })
  articleId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ARTICLE_ID' })
  catalogArticleId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ARTICLE_ID' })
  tenantArticleId: string;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

  @Column({
    name: 'QUANTITE',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  quantite: number | null;

  @OneToOne(() => LigneOuvrage, (ligne) => ligne.ligneOuvrageArticle, {
    nullable: false,
  })
  @JoinColumn([
    { name: 'LIGNE_OUVRAGE_ID', referencedColumnName: 'ligneOuvrageId' },
    { name: 'OUVRAGE_ID', referencedColumnName: 'ouvrageId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  ligneOuvrage: LigneOuvrage;

  @ManyToOne(() => ArticleEntity, (article) => article.lignesOuvrageArticle, {
    nullable: false,
  })
  @JoinColumn([
    { name: 'ARTICLE_ID', referencedColumnName: 'articleId' },
    { name: 'CATALOG_ARTICLE_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ARTICLE_ID', referencedColumnName: 'tenantId' },
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
