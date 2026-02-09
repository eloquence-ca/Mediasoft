import { City } from 'src/city/entities/city.entity';
import { Company } from 'src/company/entities/company.entity';
import { Customer } from 'src/customer/entities/customer.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER', nullable: true })
  idCustomer: string;

  @Column('uuid', { name: 'ID_CITY', nullable: true })
  idCity?: string | null;

  @Column({ name: 'LABEL', type: 'varchar', length: 255, nullable: false })
  label: string;

  @Column({ name: 'TRACK_NUM', type: 'int', nullable: true })
  trackNum: number;

  @Column({ name: 'TRACK_NAME', type: 'varchar', length: 255, nullable: true })
  trackName: string;

  @Column({ name: 'COMPLEMENT', type: 'varchar', length: 255, nullable: true })
  complement?: string | null;

  @Column({ name: 'CITY_NAME', type: 'varchar', length: 255, nullable: true })
  cityName: string;

  @Column({
    name: 'COUNTRY_NAME',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  countryName: string;

  @Column({ name: 'POSTAL_CODE', type: 'varchar', length: 255, nullable: true })
  postalCode: string;

  @OneToOne(() => Customer, (customerBilling) => customerBilling.billingAddress)
  customerBilling: Customer;

  @OneToOne(() => Customer, (customerHead) => customerHead.headAddress)
  customerHead: Customer;

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

  @OneToOne(() => Company, (company) => company.billingAddress)
  companyBilling: Company;

  @OneToOne(() => Company, (company) => company.headOffice)
  companyHeadOffice: Company;

  @ManyToOne(() => City, (city) => city.addresses, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CITY',
      referencedColumnName: 'id',
    },
  ])
  city: City;

  @ManyToOne(() => Customer, (customer) => customer.workAddresses, {
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
