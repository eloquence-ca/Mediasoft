import { City } from 'src/city/entities/city.entity';
import { Document } from 'src/document/entities/document.entity';
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

@Entity('address-clone')
export class AddressClone {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CITY', nullable: true })
  idCity: string;

  @Column({ name: 'LABEL', type: 'varchar', length: 255, nullable: false })
  label: string;

  @Column({ name: 'TRACK_NUM', type: 'int', nullable: true })
  trackNum: number;

  @Column({ name: 'TRACK_NAME', type: 'varchar', length: 255, nullable: true })
  trackName: string;

  @Column({ name: 'COMPLEMENT', type: 'varchar', length: 255, nullable: true })
  complement: string;

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

  @Column({
    name: 'DATA',
    type: 'jsonb',
    nullable: true,
  })
  data: Record<string, any>;

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

  @ManyToOne(() => City, (city) => city.addressesClone, {
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

  @OneToOne(() => Document, (documentBilling) => documentBilling.billingAddress)
  documentBilling: Document;

  @OneToOne(() => Document, (documentBilling) => documentBilling.workAddress)
  documentWork: Document;
}
