import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Directory } from './directory.entity';
import { Company } from 'src/company/entities/company.entity';

@Entity('directory-company')
export class DirectoryCompany {
  @Column('uuid', { name: 'ID_DIRECTORY', primary: true })
  idDirectory: string;

  @Column('uuid', { name: 'ID_COMPANY', primary: true })
  idCompany: string;

  @Column({ name: 'IS_DEFAULT', type: 'boolean' })
  isDefault: boolean;

  @ManyToOne(() => Directory, (directory) => directory.directoryCompanies, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn([
    {
      name: 'ID_DIRECTORY',
      referencedColumnName: 'id',
    },
  ])
  directory: Directory;

  @ManyToOne(() => Company, (company) => company.directoryCompanies, {
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
}
