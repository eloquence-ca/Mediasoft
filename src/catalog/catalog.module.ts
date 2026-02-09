import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CatalogEntity } from './entities/catalog.entity';
import { ArticleEntity } from 'src/article/entities/article.entity';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import { JobEntity } from 'src/job/entities/job.entity';
import { Company } from 'src/company/entities/company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogMergeService } from './catalog-merge.service';
import { Family } from 'src/family/entities/family.entity';
import { CatalogLayerService } from './catalog-layer.service';
import { ArticleNature } from 'src/article-nature/entities/article-nature.entity';
import { UnitEntity } from 'src/unit/entities/unit.entity';
import { LigneOuvrageArticle } from 'src/ligne-ouvrage/entities/ligne-ouvrage-article.entity';
import { LigneOuvrage } from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import { FamilyArticle } from 'src/family/entities/family-article.entity';
import { FamilyOuvrage } from 'src/family/entities/family-ouvrage.entity';
import { CatalogCompany } from './entities/catalog-company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LigneOuvrageArticle,
      FamilyArticle,
      FamilyOuvrage,
      CatalogCompany,
      CatalogEntity,
      ArticleEntity,
      ArticleNature,
      LigneOuvrage,
      UnitEntity,
      Ouvrage,
      Family,
      JobEntity,
      Company,
    ]),
  ],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogMergeService, CatalogLayerService],
  exports: [CatalogService, CatalogMergeService, CatalogLayerService],
})
export class CatalogModule {}
