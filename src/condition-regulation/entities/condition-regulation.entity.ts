import { Customer } from 'src/customer/entities/customer.entity';
import { Document } from 'src/document/entities/document.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('condition-regulation')
export class ConditionRegulation {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'LABEL', type: 'varchar', length: 255, nullable: false })
  label: string;

  @Column({ name: 'CODE', type: 'varchar', length: 255, nullable: false })
  code: string;

  @Column({
    name: 'RATE',
    type: 'decimal',
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? parseFloat(value) : value),
    },
  })
  rate: number;

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

  @OneToMany(() => Customer, (customer) => customer.conditionRegulation, {
    cascade: true,
  })
  customers: Customer[];

  @OneToMany(() => Document, (document) => document.conditionRegulation, {
    cascade: true,
  })
  documents: Document[];
}
