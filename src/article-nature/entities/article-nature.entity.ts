import { Exclude } from 'class-transformer';
import { ArticleEntity } from 'src/article/entities/article.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity()
export class ArticleNature {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'CODE', type: 'varchar', length: 100, nullable: false })
  code: string;

  @Column({ name: 'TITLE', type: 'varchar', length: 255, nullable: false })
  title: string;

  @OneToMany(() => ArticleEntity, (article) => article.articleNature)
  articles: ArticleEntity[];

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
