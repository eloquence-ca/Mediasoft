import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { CustomerModule } from '../customer/customer.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CompanyModule } from '../company/company.module';
import { DocumentModule } from '../document/document.module';
import { UserModule } from '../user/user.module';
import { TvaRateModule } from '../tva-rate/tva-rate.module';
// Nouveaux services
import { AgentCacheService } from './services/agent-cache.service';
import { RateLimitService } from './services/rate-limit.service';
import { ConversationMemoryService } from './services/conversation-memory.service';
import { ObservabilityService } from './services/observability.service';
import { MultiModelService } from './services/multi-model.service';

/**
 * Module AI Agent
 * Gère toutes les fonctionnalités liées à l'agent IA
 * 
 * Fonctionnalités incluses:
 * - Cache d'agent pour performance (Redis)
 * - Rate limiting pour sécurité
 * - Mémoire de conversation pour UX
 * - Observabilité pour maintenance
 * - Support multi-modèles pour résilience
 */
@Module({
  imports: [
    CustomerModule,
    CatalogModule,
    CompanyModule,
    DocumentModule,
    UserModule,
    TvaRateModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AgentCacheService,
    RateLimitService,
    ConversationMemoryService,
    ObservabilityService,
    MultiModelService,
  ],
  exports: [
    AiService,
    AgentCacheService,
    RateLimitService,
    ConversationMemoryService,
    ObservabilityService,
    MultiModelService,
  ],
})
export class AiModule {}
