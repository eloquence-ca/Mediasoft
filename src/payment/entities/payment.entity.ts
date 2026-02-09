import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Bill } from './bill.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import { PaymentMethod } from './payment-method.entity';

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER' })
  idCustomer: string;

  @Column('uuid', { name: 'ID_PAYMENT_METHOD' })
  idPaymentMethod: string;

  @Column({ name: 'REF', type: 'varchar', length: 255 })
  ref: string;

  @Column({
    name: 'MONTANT',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  montant: number;

  @Column({
    name: 'DATE',
    type: 'timestamptz',
    nullable: true,
  })
  date: Date;

  @Column({
    name: 'DUE_DATE',
    type: 'timestamptz',
    nullable: true,
  })
  dueDate: Date;

  @Column({
    name: 'PAYMENT_DATE',
    type: 'timestamptz',
    nullable: true,
  })
  paymentDate: Date;

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

  @OneToMany(() => Bill, (bill) => bill.payment, {
    cascade: true,
  })
  bills: Bill[];

  @ManyToOne(() => Customer, (customer) => customer.payments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CUSTOMER',
      referencedColumnName: 'id',
    },
  ])
  customer: Customer;

  @ManyToOne(() => PaymentMethod, (paymentMethod) => paymentMethod.payments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_PAYMENT_METHOD',
      referencedColumnName: 'id',
    },
  ])
  paymentMethod: PaymentMethod;
}
