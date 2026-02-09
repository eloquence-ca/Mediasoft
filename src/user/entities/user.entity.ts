import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CIVILITY } from '../enum';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { UserCompany } from './user-company.entity';
import { Document } from 'src/document/entities/document.entity';

@Entity('user')
@Index('UQ_user_email_active', ['email'], {
  unique: true,
  where: '"DELETED_AT" IS NULL',
})
@Index('UQ_user_slug_active', ['slug'], {
  unique: true,
  where: '"DELETED_AT" IS NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column('uuid', { name: 'ID_TENANT' })
  idTenant: string;

  @Column({
    name: 'EMAIL',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  email: string;

  @Column({
    name: 'SLUG',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  slug: string;

  @Column({ name: 'FIRSTNAME', type: 'varchar', length: 255, nullable: false })
  firstname: string;

  @Column({ name: 'LASTNAME', type: 'varchar', length: 255, nullable: false })
  lastname: string;

  @Column({ name: 'PHONE', type: 'varchar', length: 255, nullable: true })
  phone: string;

  @Column({ name: 'CELL_PHONE', type: 'varchar', length: 255, nullable: true })
  cellPhone: string;

  @Column({ name: 'IS_ADMIN', type: 'boolean', nullable: false })
  isAdmin: boolean;

  @Column({
    name: 'CIVILITY',
    type: 'enum',
    enum: CIVILITY,
    nullable: true,
  })
  civility: CIVILITY;

  @Column({
    name: 'TIMEZONE',
    type: 'varchar',
    length: 50,
    default: 'Europe/Paris',
    nullable: false,
  })
  timezone: string;

  @Column({
    name: 'PREFERENCES',
    type: 'jsonb',
    default: () => "'{}'",
    nullable: false,
  })
  preferences: Record<string, any>;

  @Column({
    name: 'TIMESTAMP',
    type: 'bigint',
    nullable: false,
    default: () => 'EXTRACT(EPOCH FROM NOW()) * 1000',
  })
  timestamp: number;

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

  @OneToMany(() => UserCompany, (userCompany) => userCompany.user, {
    cascade: true,
  })
  userCompanies: UserCompany[];

  @OneToMany(() => Document, (document) => document.createdBy, {
    cascade: true,
  })
  documentsCreated: Document[];

  @OneToMany(() => Document, (document) => document.updatedBy, {
    cascade: true,
  })
  documentsUpdated: Document[];

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_TENANT',
      referencedColumnName: 'id',
    },
  ])
  tenant: Tenant;
}
