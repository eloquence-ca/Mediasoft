import { Exclude } from 'class-transformer';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('job')
export class JobEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({
    name: 'TITLE',
    type: 'varchar',
    unique: true,
    length: 255,
    nullable: false,
  })
  title: string;

  @ManyToMany(() => Tenant, (tenant) => tenant.jobs)
  @JoinTable({
    name: 'job_tenant',
    joinColumn: {
      name: 'job_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'tenant_id',
      referencedColumnName: 'id',
    },
  })
  tenants: Tenant[];

  @CreateDateColumn({
    name: 'CREATION_DATE',
    type: 'timestamptz',
  })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_DATE',
    type: 'timestamptz',
  })
  @Exclude()
  updatedAt: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
