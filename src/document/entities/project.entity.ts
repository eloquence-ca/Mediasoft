import { Company } from 'src/company/entities/company.entity';
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
import { Document } from './document.entity';
import { Bill } from 'src/payment/entities/bill.entity';

@Entity('project')
export class Project {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_COMPANY' })
  idCompany: string;

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

  @ManyToOne(() => Company, (company) => company.projects, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_COMPANY',
      referencedColumnName: 'id',
    },
  ])
  company: Company;

  @OneToMany(() => Document, (document) => document.project, {
    cascade: true,
  })
  documents: Document[];

  @OneToMany(() => Bill, (bill) => bill.project, {
    cascade: true,
  })
  bills: Bill[];
}
