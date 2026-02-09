import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleNature } from 'src/article-nature/entities/article-nature.entity';
import { Company } from 'src/company/entities/company.entity';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { UserCompany } from 'src/user/entities/user-company.entity';
import { User } from 'src/user/entities/user.entity';
import { KafkaService } from './services/kafka.service';
import { SynchroService } from './services/synchro.service';
import { NumberingModule } from 'src/numbering/numbering.module';
import { UnitEntity } from 'src/unit/entities/unit.entity';
import { Country } from 'src/country/entities/country.entity';
import { City } from 'src/city/entities/city.entity';
import { JobEntity } from 'src/job/entities/job.entity';
import { TvaRate } from 'src/tva-rate/entities/tva-rate.entity';
import { ConditionRegulation } from 'src/condition-regulation/entities/condition-regulation.entity';
import { CatalogEntity } from 'src/catalog/entities/catalog.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      User,
      Tenant,
      UserCompany,
      UnitEntity,
      Country,
      City,
      JobEntity,
      TvaRate,
      ConditionRegulation,
      ArticleNature,
      CatalogEntity,
    ]),
    NumberingModule,
  ],
  providers: [SynchroService, KafkaService],
  exports: [SynchroService, KafkaService],
})
export class CommonModule {}
