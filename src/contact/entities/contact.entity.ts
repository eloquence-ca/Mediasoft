import { Customer } from 'src/customer/entities/customer.entity';
import { CIVILITY } from 'src/user/enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contact')
export class Contact {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER' })
  idCustomer: string;

  @Column({
    name: 'EMAIL',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email: string;

  @Column({ name: 'FIRSTNAME', type: 'varchar', length: 255, nullable: false })
  firstname: string;

  @Column({ name: 'LASTNAME', type: 'varchar', length: 255, nullable: false })
  lastname: string;

  @Column({
    name: 'CIVILITY',
    type: 'enum',
    enum: CIVILITY,
    nullable: true,
  })
  civility: CIVILITY;

  @Column({ name: 'PHONE', type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ name: 'CELL_PHONE', type: 'varchar', length: 255, nullable: true })
  cellPhone: string;

  @Column({
    name: 'QUOTE_RECIPIENT',
    type: 'boolean',
    nullable: false,
  })
  quoteRecipient: boolean;

  @Column({
    name: 'INVOICE_RECIPIENT',
    type: 'boolean',
    nullable: false,
  })
  invoiceRecipient: boolean;

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

  @ManyToOne(() => Customer, (customer) => customer.contacts, {
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
}
