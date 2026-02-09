import { Exclude } from 'class-transformer';
import { CatalogEntity } from 'src/catalog/entities/catalog.entity';
import { ComponentDocument } from 'src/document/entities/component-document.entity';
import { FamilyOuvrage } from 'src/family/entities/family-ouvrage.entity';
import { LigneOuvrage } from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import { UnitEntity } from 'src/unit/entities/unit.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ouvrage')
@Index(['designation', 'catalogId', 'tenantId'], { unique: true })
export class Ouvrage {
  @PrimaryGeneratedColumn('uuid', { name: 'OUVRAGE_ID' })
  ouvrageId: string;

  @PrimaryColumn('uuid', { name: 'CATALOG_ID' })
  catalogId: string;

  @PrimaryColumn('uuid', { name: 'TENANT_ID' })
  tenantId: string;

  @Column('uuid', { name: 'UNIT_ID', nullable: true })
  unitId: string | null;

  @Column({
    name: 'DESIGNATION',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  designation?: string | null;

  @Column({
    name: 'PRIX',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value ? Number.parseFloat(value) : value),
    },
  })
  prix?: number | null;

  @Column({ name: 'IS_DELETED', type: 'boolean', nullable: true })
  isDeleted: boolean | null;

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

  @ManyToOne(() => CatalogEntity, (catalog) => catalog.ouvrages, {
    nullable: false,
  })
  @JoinColumn([
    { name: 'CATALOG_ID', referencedColumnName: 'catalogId' },
    { name: 'TENANT_ID', referencedColumnName: 'tenantId' },
  ])
  catalog: CatalogEntity;

  @OneToMany(() => LigneOuvrage, (ligne) => ligne.ouvrage)
  lignesOuvrage: LigneOuvrage[];

  @OneToMany(() => ComponentDocument, (component) => component.ouvrage)
  components: ComponentDocument[];

  @OneToMany(() => FamilyOuvrage, (familyOuvrage) => familyOuvrage.ouvrage, {
    cascade: true,
  })
  familyOuvrages: FamilyOuvrage[];

  @ManyToOne(() => UnitEntity, (unit) => unit.ouvrages, {
    nullable: true,
  })
  @JoinColumn({ name: 'UNIT_ID' })
  unit?: UnitEntity | null;
}
