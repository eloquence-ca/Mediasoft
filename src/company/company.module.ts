import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectoryCompany } from 'src/directory/entities/directory-company.entity';
import { Directory } from 'src/directory/entities/directory.entity';
import { NumberingModule } from 'src/numbering/numbering.module';
import { UserCompany } from 'src/user/entities/user-company.entity';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      UserCompany,
      DirectoryCompany,
      Directory,
    ]),
    NumberingModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
