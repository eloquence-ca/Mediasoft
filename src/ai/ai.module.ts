import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CustomerModule } from '../customer/customer.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CompanyModule } from '../company/company.module';
import { DocumentModule } from '../document/document.module';
import { UserModule } from '../user/user.module';
import { TvaRateModule } from '../tva-rate/tva-rate.module';

/**
 * Module AI Agent
 * Gère toutes les fonctionnalités liées à l'agent IA
 */
@Module({
  imports: [CustomerModule, CatalogModule, CompanyModule, DocumentModule, UserModule, TvaRateModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

