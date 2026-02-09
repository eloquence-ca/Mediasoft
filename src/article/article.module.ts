import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from 'src/family/entities/family.entity';
import { LigneOuvrage } from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import { ArticleEntity } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ArticleEntity, Family, LigneOuvrage])],
  controllers: [],
  providers: [],
  exports: [],
})
export class ArticleModule {}
