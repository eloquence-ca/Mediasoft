import { CIVILITY } from 'src/user/enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer-individual')
export class CustomerIndividual {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER' })
  idCustomer: string;

  @Column({ name: 'FIRSTNAME', type: 'varchar', length: 255, nullable: true })
  firstname: string;

  @Column({ name: 'LASTNAME', type: 'varchar', length: 255, nullable: true })
  lastname: string;

  @Column({
    name: 'CIVILITY',
    type: 'enum',
    enum: CIVILITY,
    nullable: true,
  })
  civility: CIVILITY;

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

  @OneToOne(() => Customer, (customer) => customer.individual, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CUSTOMER',
      referencedColumnName: 'id',
    },
  ])
  customer: Customer;
}
