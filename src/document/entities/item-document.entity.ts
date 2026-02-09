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
import { TvaRate } from 'src/tva-rate/entities/tva-rate.entity';
import { ComponentDocument } from './component-document.entity';

export enum TYPE_ITEM_DOCUMENT {
  TITLE = 'TITLE',
  ARTICLE = 'ARTICLE',
  OUVRAGE = 'OUVRAGE',
}

@Entity('item_documents')
export class ItemDocument {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_DOCUMENT' })
  idDocument: string;

  @Column('uuid', { name: 'ID_COMPONENT', nullable: true })
  idComponent?: string | null;

  @Column('uuid', { name: 'ID_PARENT', nullable: true })
  idParent?: string | null;

  @Column('uuid', { name: 'ID_TVA_RATE', nullable: true })
  idTvaRate?: string | null;

  @Column({ name: 'POSITION', type: 'int', nullable: false })
  position: number;

  @Column({
    name: 'TYPE',
    type: 'enum',
    enum: TYPE_ITEM_DOCUMENT,
    nullable: false,
  })
  type: TYPE_ITEM_DOCUMENT;

  @Column({ name: 'TITLE', type: 'varchar', length: 255, nullable: true })
  title?: string | null;

  @Column({
    name: 'QUANTITY',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  quantity?: number | null;

  @Column({
    name: 'TOTAL_HT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  totalHT?: number | null;

  @Column({
    name: 'TOTAL_TVA',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  totalTVA?: number | null;

  @Column({
    name: 'TOTAL_TTC',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  totalTTC?: number | null;

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

  @ManyToOne(() => Document, (type) => type.items, {
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

  @ManyToOne(() => ComponentDocument, (component) => component.items, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_COMPONENT',
      referencedColumnName: 'id',
    },
  ])
  component: ComponentDocument;

  @ManyToOne(() => ItemDocument, (parent) => parent.items, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn([
    {
      name: 'ID_PARENT',
      referencedColumnName: 'id',
    },
  ])
  parent: ItemDocument;

  @ManyToOne(() => TvaRate, (tvaRate) => tvaRate.items, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn([
    {
      name: 'ID_TVA_RATE',
      referencedColumnName: 'id',
    },
  ])
  tvaRate?: TvaRate | null;

  @OneToMany(() => ItemDocument, (item) => item.parent, {
    cascade: true,
  })
  items: ItemDocument[];
}
