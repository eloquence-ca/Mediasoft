import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LigneOuvrageArticle } from './entities/ligne-ouvrage-article.entity';
import { LigneOuvrage } from './entities/ligne-ouvrage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LigneOuvrage, LigneOuvrageArticle])],
  controllers: [],
  providers: [],
  exports: [],
})
export class LigneOuvrageModule {}
