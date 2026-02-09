import { Exclude } from 'class-transformer';
import { Commentaire } from 'src/commentaire/entities/commentaire.entity';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
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
import { LigneOuvrageArticle } from './ligne-ouvrage-article.entity';

export enum TypeLigneOuvrage {
  ARTICLE = 'ARTICLE',
  COMMENTAIRE = 'COMMENTAIRE',
}

@Entity('ligne-ouvrage')
export class LigneOuvrage {
  @PrimaryGeneratedColumn('uuid', { name: 'LIGNE_OUVRAGE_ID' })
  ligneOuvrageId: string;

  @PrimaryColumn('uuid', { name: 'OUVRAGE_ID' })
  ouvrageId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ID' })
  tenantId: string;

  @Column('uuid', { name: 'COMMENTAIRE_ID', nullable: true })
  commentaireId?: string;

  @Column('uuid', { name: 'COMMENTAIRE_TENANT_ID', nullable: true })
  commentaireTenantId?: string;

  @Column({ name: 'NO_ORDRE', type: 'int', nullable: true })
  noOrdre: number | null;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

  @Column({
    name: 'TYPE_LIGNE_OUVRAGE',
    type: 'enum',
    enum: TypeLigneOuvrage,
    nullable: true,
  })
  typeLigneOuvrage: TypeLigneOuvrage | null;

  @ManyToOne(() => Ouvrage, (ouvrage) => ouvrage.lignesOuvrage, {
    nullable: false,
  })
  @JoinColumn([
    { name: 'OUVRAGE_ID', referencedColumnName: 'ouvrageId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  ouvrage: Ouvrage;

  @ManyToOne(() => Commentaire, (commentaire) => commentaire.lignesOuvrage, {
    nullable: true,
  })
  @JoinColumn([
    { name: 'COMMENTAIRE_ID', referencedColumnName: 'commentaireId' },
    { name: 'COMMENTAIRE_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  commentaire?: Commentaire;

  @OneToOne(() => LigneOuvrageArticle, (ligne) => ligne.ligneOuvrage, {
    cascade: true,
  })
  ligneOuvrageArticle?: LigneOuvrageArticle;

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
