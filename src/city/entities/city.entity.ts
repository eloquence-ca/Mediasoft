import { Address } from 'src/address/entities/address.entity';
import { Country } from 'src/country/entities/country.entity';
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

@Entity('city')
export class City {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_COUNTRY' })
  idCountry: string;

  @Column({ name: 'NAME', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'CODE', type: 'varchar', length: 20, nullable: false })
  code: string;

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

  @OneToMany(() => Address, (address) => address.city, {
    cascade: true,
  })
  addresses: Address[];

  @OneToMany(() => Address, (address) => address.city, {
    cascade: true,
  })
  addressesClone: Address[];

  @ManyToOne(() => Country, (country) => country.cities, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_COUNTRY',
      referencedColumnName: 'id',
    },
  ])
  country: Country;
}
