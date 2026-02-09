import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('file')
export class File {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({
    name: 'NAME',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  name: string;

  @Column({
    name: 'EXTENSION',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  extension: string;

  @Column({
    name: 'PATH',
    type: 'text',
    nullable: false,
  })
  path: string;

  @CreateDateColumn({
    name: 'CREATED_AT',
    type: 'timestamptz',
    nullable: false,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'UPDATED_AT',
    type: 'timestamptz',
    nullable: false,
  })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
