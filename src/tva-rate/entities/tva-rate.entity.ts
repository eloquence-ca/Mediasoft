import { Customer } from 'src/customer/entities/customer.entity';
import { Document } from 'src/document/entities/document.entity';
import { ItemDocument } from 'src/document/entities/item-document.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tva-rate')
export class TvaRate {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'LABEL', type: 'varchar', length: 255, nullable: false })
  label: string;

  @Column({ name: 'CODE', type: 'varchar', length: 255, nullable: false })
  code: string;

  @Column({ name: 'RATE', type: 'decimal', nullable: false })
  rate: number;

  @Column({ name: 'IS_DELETED', type: 'boolean', default: false })
  isDeleted: boolean;

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

  @OneToMany(() => Customer, (customer) => customer.tvaRate, {
    cascade: true,
  })
  customers: Customer[];

  @OneToMany(() => ItemDocument, (item) => item.tvaRate, {
    cascade: true,
  })
  items: ItemDocument[];

  @OneToMany(() => Document, (document) => document.tvaRate, {
    cascade: true,
  })
  documents: Document[];
}
