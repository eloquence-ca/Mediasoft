import { Exclude } from 'class-transformer';
import { LigneOuvrage } from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('commentaire')
export class Commentaire {
  @PrimaryGeneratedColumn('uuid', { name: 'COMMENTAIRE_ID' })
  commentaireId: string;

  @PrimaryColumn({ name: 'TENANT_ID', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'DESCRIPTION', type: 'text', nullable: true })
  description: string | null;

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

  @OneToMany(() => LigneOuvrage, (ligne) => ligne.commentaire)
  lignesOuvrage: LigneOuvrage[];

  @ManyToOne(() => Tenant, (tenant) => tenant.commentaires, {
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
