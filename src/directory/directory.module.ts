import { Module } from '@nestjs/common';
import { DirectoryService } from './directory.service';
import { DirectoryController } from './directory.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Directory } from './entities/directory.entity';
import { DirectoryCompany } from './entities/directory-company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Directory, DirectoryCompany])],
  controllers: [DirectoryController],
  providers: [DirectoryService],
})
export class DirectoryModule {}
