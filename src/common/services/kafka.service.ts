import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer, Kafka, Producer } from 'kafkajs';
import {
  SynchroInterface,
  SynchroTenantCatalogInterface,
  SynchroUserCompanyInterface,
} from '../interfaces/synchro.interface';
import { SynchroService } from './synchro.service';

export enum MessageType {
  USERS_UPDATED = 'users.updated',
  TENANTS_UPDATED = 'tenants.updated',
  COMPANIES_UPDATED = 'companies.updated',
  COMPANIES_UPDATE_USER_ROLE = 'companies.update_user_role',

  USER_UPDATED = 'user.updated',
  TENANT_UPDATED = 'tenant.updated',
  COMPANY_UPDATED = 'company.updated',
  COMPANY_UPDATE_USER_ROLE = 'company.update_user_role',
  COMPANY_REMOVE_USER = 'company.remove_user',

  USER_DELETED = 'user.deleted',
  TENANT_DELETED = 'tenant.deleted',
  COMPANY_DELETED = 'company.deleted',

  USER_SYNCHRO = 'user.synchro',
  TENANT_SYNCHRO = 'tenant.synchro',
  COMPANY_SYNCHRO = 'company.synchro',
  USER_COMPANY_SYNCHRO = 'company.user_company.synchro',

  UNIT_UPSERT = 'unit.upsert',
  UNIT_DELETED = 'unit.deleted',

  ARTICLE_NATURE_UPSERT = 'article_nature.upsert',
  ARTICLE_NATURE_DELETED = 'article_nature.deleted',

  COUNTRY_UPSERT = 'country.upsert',
  COUNTRY_DELETED = 'country.deleted',

  CITY_UPSERT = 'city.upsert',
  CITY_DELETED = 'city.deleted',

  JOB_UPSERT = 'job.upsert',
  JOB_DELETED = 'job.deleted',

  TVA_RATE_UPSERT = 'tva_rate.upsert',
  TVA_RATE_DELETED = 'tva_rate.deleted',

  CONDITION_REGULATION_UPSERT = 'condition_regulation.upsert',
  CONDITION_REGULATION_DELETED = 'condition_regulation.deleted',

  CATALOG_PUBLISHED = 'catalog.published',
  CATALOG_TENTANTS_UPSERT = 'catalog_tenants.upsert',
}

export enum SynchroMessageType {
  USER_SYNCHRO = 'user.synchro',
  TENANT_SYNCHRO = 'tenant.synchro',
  COMPANY_SYNCHRO = 'company.synchro',
  TENANT_CATALOG_SYNCHRO = 'catalog_tenant.synchro',
  USER_COMPANY_SYNCHRO = 'company.user_company.synchro',
}

interface EventInterface {
  event: MessageType;
  data: any;
}

export type SynchroPayloadMap = {
  [SynchroMessageType.USER_SYNCHRO]: SynchroInterface;
  [SynchroMessageType.TENANT_SYNCHRO]: SynchroInterface;
  [SynchroMessageType.COMPANY_SYNCHRO]: SynchroInterface;
  [SynchroMessageType.TENANT_CATALOG_SYNCHRO]: SynchroTenantCatalogInterface;
  [SynchroMessageType.USER_COMPANY_SYNCHRO]: SynchroUserCompanyInterface;
};

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly kafka: Kafka;
  private readonly producer: Producer;
  private readonly consumer: Consumer;
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject(forwardRef(() => SynchroService))
    private readonly synchro: SynchroService,
  ) {
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT,
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      sasl: {
        mechanism: 'scram-sha-512',
        username: process.env.KAFKA_USER || '',
        password: process.env.KAFKA_PASSWORD || '',
      },
      ssl: false,
    });
    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP || 'default-group',
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async connect() {
    await this.producer.connect();

    await this.consumer.connect();

    await this.consumer.subscribe({
      topic: process.env.KAFKA_TOPIC || '',
      fromBeginning: false,
    });

    await this.consumer.subscribe({
      topic: process.env.KAFKA_GLOBAL_TOPIC || '',
      fromBeginning: false,
    });

    this.consumer.run({
      partitionsConsumedConcurrently: Number(
        process.env.KAFKA_PARTITIONS_CONCURRENCY || 1,
      ),
      eachMessage: async ({ topic, message }) => {
        this.logger.log(`Traitement message Kafka: ${topic}`);
        if (!message.value) return;

        try {
          const data: EventInterface = JSON.parse(message.value.toString());
          this.logger.log(data);

          switch (data.event) {
            case MessageType.USER_UPDATED:
              await this.synchro.handleUserUpdated(data.data);
              break;

            case MessageType.USERS_UPDATED:
              await this.synchro.handleUsersUpdated(data.data);
              break;

            case MessageType.TENANT_UPDATED:
              await this.synchro.handleTenantUpdated(data.data);
              break;

            case MessageType.TENANTS_UPDATED:
              await this.synchro.handleTenantsUpdated(data.data);
              break;

            case MessageType.COMPANY_UPDATED:
              await this.synchro.handleCompanyUpdated(data.data);
              break;

            case MessageType.COMPANIES_UPDATED:
              await this.synchro.handleCompaniesUpdated(data.data);
              break;

            case MessageType.COMPANY_UPDATE_USER_ROLE:
              await this.synchro.handleCompanyUpdateUserRole(data.data);
              break;

            case MessageType.COMPANIES_UPDATE_USER_ROLE:
              await this.synchro.handleCompaniesUpdateUserRole(data.data);
              break;

            case MessageType.COMPANY_REMOVE_USER:
              await this.synchro.handleCompanyRemoveUser(data.data);
              break;

            case MessageType.USER_DELETED:
              await this.synchro.handleUserDeleted(data.data);
              break;

            case MessageType.TENANT_DELETED:
              await this.synchro.handleTenantDeleted(data.data);
              break;

            case MessageType.COMPANY_DELETED:
              await this.synchro.handleCompanyDeleted(data.data);
              break;

            case MessageType.UNIT_UPSERT:
              await this.synchro.handleUpsertUnit(data.data);
              break;

            case MessageType.UNIT_DELETED:
              await this.synchro.handleDeleteUnit(data.data);
              break;

            case MessageType.ARTICLE_NATURE_UPSERT:
              await this.synchro.handleUpsertArticleNature(data.data);
              break;

            case MessageType.ARTICLE_NATURE_DELETED:
              await this.synchro.handleDeleteArticleNature(data.data);
              break;

            case MessageType.COUNTRY_UPSERT:
              await this.synchro.handleUpsertCountry(data.data);
              break;

            case MessageType.COUNTRY_DELETED:
              await this.synchro.handleDeleteCountry(data.data);
              break;

            case MessageType.CITY_UPSERT:
              await this.synchro.handleUpsertCity(data.data);
              break;

            case MessageType.CITY_DELETED:
              await this.synchro.handleDeleteCity(data.data);
              break;

            case MessageType.JOB_UPSERT:
              await this.synchro.handleUpsertJob(data.data);
              break;

            case MessageType.JOB_DELETED:
              await this.synchro.handleDeleteJob(data.data);
              break;

            case MessageType.TVA_RATE_UPSERT:
              await this.synchro.handleUpsertTvaRate(data.data);
              break;

            // case MessageType.TVA_RATE_DELETED:
            //   await this.synchro.handleDeleteTvaRate(data.data);
            //   break;

            case MessageType.CONDITION_REGULATION_UPSERT:
              await this.synchro.handleUpsertConditionRegulation(data.data);
              break;

            // case MessageType.CONDITION_REGULATION_DELETED:
            //   await this.synchro.handleDeleteConditionRegulation(data.data);
            //   break;

            case MessageType.CATALOG_PUBLISHED:
              await this.synchro.handleCatalogPublish(data.data);
              break;

            case MessageType.CATALOG_TENTANTS_UPSERT:
              await this.synchro.handleTenantCatalogsUpsert(data.data);
              break;

            default:
              break;
          }
        } catch (error) {
          this.logger.error('Erreur traitement message Kafka', error);
        }
      },
    });
  }

  async send(topic: string, event: EventInterface) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(event) }],
    });
  }

  async sendSynchro<K extends SynchroMessageType>(
    type: K,
    data: SynchroPayloadMap[K],
  ) {
    await this.producer.send({
      topic: process.env.KAFKA_TOPIC_GMS || 'gms',
      messages: [{ value: JSON.stringify({ event: type, data }) }],
    });
  }
}
