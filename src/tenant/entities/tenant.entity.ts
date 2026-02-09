import { CatalogEntity } from 'src/catalog/entities/catalog.entity';
import { Commentaire } from 'src/commentaire/entities/commentaire.entity';
import { Company } from 'src/company/entities/company.entity';
import { Directory } from 'src/directory/entities/directory.entity';
import { Document } from 'src/document/entities/document.entity';
import { JobEntity } from 'src/job/entities/job.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}
@Entity('tenant')
export class Tenant {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'NAME', type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ name: 'DOMAINE', type: 'varchar', length: 255, nullable: true })
  domaine?: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
    nullable: false,
  })
  status: TenantStatus;

  @Column({ name: 'START_DATE_TRIAL', type: 'timestamptz', nullable: true })
  startDateTrial?: Date;

  @Column({ name: 'END_DATE_TRIAL', type: 'timestamptz', nullable: true })
  endDateTrial?: Date;

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

  @OneToMany(() => User, (user) => user.tenant, {
    cascade: true,
  })
  users: User[];

  @OneToMany(() => Company, (company) => company.tenant, {
    cascade: true,
  })
  companies: Company[];

  @OneToMany(() => Directory, (directory) => directory.tenant, {
    cascade: true,
  })
  directories: Directory[];

  @ManyToMany(() => JobEntity, (job) => job.tenants)
  jobs: JobEntity[];

  @OneToMany(() => Document, (document) => document.tenant, {
    cascade: true,
  })
  documents: Document[];

  @OneToMany(() => CatalogEntity, (catalog) => catalog.tenant)
  catalogs: CatalogEntity[];

  @OneToMany(() => Commentaire, (commentaire) => commentaire.tenant, {
    cascade: true,
  })
  commentaires: Commentaire[];
}
