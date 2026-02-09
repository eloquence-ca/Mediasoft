import { Exclude } from 'class-transformer';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Family } from './family.entity';

@Entity('family_ouvrage')
export class FamilyOuvrage {
  @PrimaryColumn('uuid', { name: 'OUVRAGE_ID' })
  ouvrageId: string;

  @PrimaryColumn('uuid', { name: 'FAMILY_ID' })
  familyId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'OUVRAGE_TENANT_ID' })
  ouvrageTenantId: string;

  @PrimaryColumn('uuid', { name: 'FAMILY_TENANT_ID' })
  familyTenantId: string;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

  @ManyToOne(() => Family, (parent) => parent.familyOuvrages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'FAMILY_ID', referencedColumnName: 'familyId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'FAMILY_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  family: Family;

  @ManyToOne(() => Ouvrage, (ouvrage) => ouvrage.familyOuvrages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'OUVRAGE_ID', referencedColumnName: 'ouvrageId' },
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'OUVRAGE_TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  ouvrage: Ouvrage;

  @CreateDateColumn({
    name: 'CREATION_DATE',
    type: 'timestamptz',
    nullable: false,
  })
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_DATE',
    type: 'timestamptz',
    nullable: false,
  })
  @Exclude()
  updatedAt: Date;
}
