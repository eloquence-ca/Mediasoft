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

@Entity('customer-public-entity')
export class CustomerPublicEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER' })
  idCustomer: string;

  @Column({
    name: 'ENTITY_NAME',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  entityName: string;

  @Column({
    name: 'SIRET',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  siret: string;

  @Column({
    name: 'CHORUS_CODE',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  chorusCode: string;

  @Column({
    name: 'CHORUS_RECIPIENT',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  chorusRecipient: string;

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

  @OneToOne(() => Customer, (customer) => customer.publicEntity, {
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
