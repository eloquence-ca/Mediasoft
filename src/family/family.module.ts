import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { FamilyArticle } from './entities/family-article.entity';
import { FamilyOuvrage } from './entities/family-ouvrage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Family, FamilyArticle, FamilyOuvrage])],
  controllers: [],
  providers: [],
  exports: [],
})
export class FamilyModule {}
