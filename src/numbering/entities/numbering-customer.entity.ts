import { Directory } from 'src/directory/entities/directory.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity('numbering')
export class NumberingCustomer {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_CUSTOMER_DIRECTORY', nullable: true })
  idCustomerDirectory: string;

  @Column({ name: 'FORMAT', type: 'varchar', length: 255, nullable: false })
  format: string;

  @Column({ name: 'COUNTER', type: 'int', default: 0, nullable: false })
  counter: number;

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

  @OneToOne(() => Directory, (directory) => directory.customerNumbering, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_CUSTOMER_DIRECTORY',
      referencedColumnName: 'id',
    },
  ])
  customerDirectory: Directory;
}
