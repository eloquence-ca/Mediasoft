import { Exclude } from 'class-transformer';
import { ArticleEntity } from 'src/article/entities/article.entity';
import { ComponentDocument } from 'src/document/entities/component-document.entity';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class UnitEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'CODE', type: 'varchar', length: 50, nullable: false })
  code: string;

  @Column({ name: 'LABEL', type: 'varchar', length: 255, nullable: false })
  label: string;

  @Column({ name: 'DECIMAL_PLACES', type: 'int', nullable: false })
  decimalPlaces: number;

  @OneToMany(() => ArticleEntity, (article) => article.saleUnit, {
    nullable: true,
  })
  saleArticles: ArticleEntity[];

  @OneToMany(() => ArticleEntity, (article) => article.purchaseUnit, {
    nullable: true,
  })
  purchaseArticles: ArticleEntity[];

  @OneToMany(() => Ouvrage, (ouvrage) => ouvrage.unit, {
    nullable: true,
  })
  ouvrages: Ouvrage[];

  @OneToMany(() => ComponentDocument, (component) => component.purchaseUnit)
  purchaseComponents: ComponentDocument[];

  @OneToMany(() => ComponentDocument, (component) => component.unit)
  components: ComponentDocument[];

  @OneToMany(() => ComponentDocument, (component) => component.saleUnit)
  saleComponents: ComponentDocument[];

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

  @DeleteDateColumn({ name: 'DELETED_AT', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
