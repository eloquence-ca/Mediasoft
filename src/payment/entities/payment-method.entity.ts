import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { PAYMENT_METHOD } from '../payment-method.service';

@Entity('payment-method')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'CODE', type: 'varchar', unique: true, length: 50 })
  code: PAYMENT_METHOD;

  @Column({ name: 'LABEL', type: 'varchar', length: 255 })
  label: string;

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

  @OneToMany(() => Payment, (payment) => payment.paymentMethod, {
    cascade: true,
  })
  payments: Payment[];
}
