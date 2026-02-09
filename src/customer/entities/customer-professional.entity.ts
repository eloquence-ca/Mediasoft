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
import { LEGAL_STATUS } from 'src/company/enum';

@Entity('customer-professional')
export class CustomerProfessional {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER' })
  idCustomer: string;

  @Column({
    name: 'COMPANY_NAME',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  companyName: string;

  @Column({
    name: 'SIRET',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  siret: string;

  @Column({
    name: 'TVA_INTRACOMMUNAUTAIRE',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  tvaIntracommunautaire: string;

  @Column({
    name: 'LEGAL_STATUS',
    type: 'enum',
    enum: LEGAL_STATUS,
    nullable: true,
  })
  legalStatus: LEGAL_STATUS;

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

  @OneToOne(() => Customer, (customer) => customer.professional, {
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
