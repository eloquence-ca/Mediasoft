import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Company } from 'src/company/entities/company.entity';

@Entity('user_company')
export class UserCompany {
  @Column('uuid', { name: 'ID_COMPANY', primary: true })
  idCompany: string;

  @Column('uuid', { name: 'ID_USER', primary: true })
  idUser: string;

  @Column({ name: 'IS_ADMIN', type: 'boolean', nullable: false })
  isAdmin: boolean;

  @Column({
    name: 'TIMESTAMP',
    type: 'bigint',
    nullable: false,
    default: () => 'EXTRACT(EPOCH FROM NOW()) * 1000',
  })
  timestamp: number;

  @ManyToOne(() => Company, (company) => company.userCompanies, {
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

  @ManyToOne(() => User, (user) => user.userCompanies, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_USER',
      referencedColumnName: 'id',
    },
  ])
  user: User;
}
