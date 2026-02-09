import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Address } from 'src/address/entities/address.entity';
import { ArticleNature } from 'src/article-nature/entities/article-nature.entity';
import { ArticleEntity } from 'src/article/entities/article.entity';
import { CatalogEntity } from 'src/catalog/entities/catalog.entity';
import { City } from 'src/city/entities/city.entity';
import { Commentaire } from 'src/commentaire/entities/commentaire.entity';
import {
  KafkaService,
  SynchroMessageType,
} from 'src/common/services/kafka.service';
import { CompanyEventDto } from 'src/company/dto/company-event.dto';
import { UserCompanyEventDto } from 'src/company/dto/user-company-event.dto';
import { Company } from 'src/company/entities/company.entity';
import { ConditionRegulation } from 'src/condition-regulation/entities/condition-regulation.entity';
import { Country } from 'src/country/entities/country.entity';
import { DirectoryCompany } from 'src/directory/entities/directory-company.entity';
import { Directory } from 'src/directory/entities/directory.entity';
import { FamilyArticle } from 'src/family/entities/family-article.entity';
import { FamilyOuvrage } from 'src/family/entities/family-ouvrage.entity';
import { Family } from 'src/family/entities/family.entity';
import { JobEntity } from 'src/job/entities/job.entity';
import { LigneOuvrageArticle } from 'src/ligne-ouvrage/entities/ligne-ouvrage-article.entity';
import { LigneOuvrage } from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import {
  DefaultFormats,
  NumberingCustomerService,
} from 'src/numbering/numbering-customer.service';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import { TenantEventDto } from 'src/tenant/dto/tenant-event.dto';
import { Tenant } from 'src/tenant/entities/tenant.entity';
import { TvaRate } from 'src/tva-rate/entities/tva-rate.entity';
import { UnitEntity } from 'src/unit/entities/unit.entity';
import { UserEventDto } from 'src/user/dto/user-event.dto';
import { UserCompany } from 'src/user/entities/user-company.entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { NIL } from '../constants';
import {
  ArticleInterface,
  CatalogInterface,
  CatalogTenantUpsert,
  CommentaireInterface,
  FamilyInterface,
  LigneOuvrageArticleInterface,
  LigneOuvrageInterface,
  OuvrageInterface,
} from '../interfaces/catalog.interface';

@Injectable()
export class SynchroService {
  private readonly logger = new Logger(SynchroService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,

    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,

    @InjectRepository(UnitEntity)
    private readonly unitEntityRepository: Repository<UnitEntity>,

    @InjectRepository(ArticleNature)
    private readonly articleNatureRepository: Repository<ArticleNature>,

    @InjectRepository(JobEntity)
    private readonly jobEntityRepository: Repository<JobEntity>,

    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,

    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,

    @InjectRepository(TvaRate)
    private readonly tvaRateRepository: Repository<TvaRate>,

    @InjectRepository(ConditionRegulation)
    private readonly conditionRegulationRepository: Repository<ConditionRegulation>,

    @InjectRepository(CatalogEntity)
    private readonly catalogEntityRepository: Repository<CatalogEntity>,

    private readonly numberingService: NumberingCustomerService,

    private readonly dataSource: DataSource,

    @Inject(forwardRef(() => KafkaService))
    private readonly event: KafkaService,
  ) {}

  async handleUpsertUnit(data: UnitEntity): Promise<UnitEntity> {
    try {
      this.logger.log(`Processing unit upsert for unit ${data.id}`);

      const existingUnit = await this.unitEntityRepository.findOne({
        where: { id: data.id },
      });

      let savedUnit: UnitEntity;

      if (existingUnit === null) {
        this.logger.log(`Unit with id ${data.id} not found, creating new unit`);
        const unit = new UnitEntity();
        Object.assign(unit, data);
        savedUnit = await this.unitEntityRepository.save(unit);
        this.logger.log(`Successfully created unit ${data.id}`);
      } else {
        this.logger.log(
          `Unit with id ${data.id} found, updating existing unit`,
        );
        Object.assign(existingUnit, data);
        savedUnit = await this.unitEntityRepository.save(existingUnit);
        this.logger.log(`Successfully updated unit ${data.id}`);
      }

      return savedUnit;
    } catch (error) {
      this.logger.error(`Failed to upsert unit ${data.id}:`, error);
      throw error;
    }
  }

  async handleDeleteUnit(data: UnitEntity): Promise<void> {
    try {
      this.logger.log(`Processing unit.deleted event for unit ${data.id}`);

      const result = await this.unitEntityRepository.softDelete({
        id: data.id,
      });

      if (result.affected === 0) {
        this.logger.warn(`Unit ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted unit ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete unit ${data.id}:`, error);
      throw error;
    }
  }

  async handleUpsertArticleNature(data: ArticleNature): Promise<ArticleNature> {
    try {
      this.logger.log(
        `Processing article nature upsert for article nature ${data.id}`,
      );

      const existing = await this.articleNatureRepository.findOne({
        where: { id: data.id },
      });

      let saved: ArticleNature;

      if (existing === null) {
        this.logger.log(
          `Article nature with id ${data.id} not found, creating new article nature`,
        );
        const articleNature = new ArticleNature();
        Object.assign(articleNature, data);
        saved = await this.articleNatureRepository.save(articleNature);
        this.logger.log(`Successfully created article nature ${data.id}`);
      } else {
        this.logger.log(
          `Article nature with id ${data.id} found, updating existing article nature`,
        );
        Object.assign(existing, data);
        saved = await this.articleNatureRepository.save(existing);
        this.logger.log(`Successfully updated article nature ${data.id}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to upsert article nature ${data.id}:`, error);
      throw error;
    }
  }

  async handleDeleteArticleNature(data: ArticleNature): Promise<void> {
    try {
      this.logger.log(
        `Processing article nature.deleted event for article nature ${data.id}`,
      );

      const result = await this.articleNatureRepository.softDelete({
        id: data.id,
      });

      if (result.affected === 0) {
        this.logger.warn(`Article nature ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted article nature ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete article nature ${data.id}:`, error);
      throw error;
    }
  }

  async handleUpsertCountry(data: Country): Promise<Country> {
    try {
      this.logger.log(`Processing country upsert for country ${data.id}`);

      const existing = await this.countryRepository.findOne({
        where: { id: data.id },
      });

      let saved: Country;

      if (existing === null) {
        this.logger.log(
          `Country with id ${data.id} not found, creating new country`,
        );
        const country = new Country();
        Object.assign(country, data);
        saved = await this.countryRepository.save(country);
        this.logger.log(`Successfully created country ${data.id}`);
      } else {
        this.logger.log(
          `Country with id ${data.id} found, updating existing country`,
        );
        Object.assign(existing, data);
        saved = await this.countryRepository.save(existing);
        this.logger.log(`Successfully updated country ${data.id}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to upsert country ${data.id}:`, error);
      throw error;
    }
  }

  async handleDeleteCountry(data: Country): Promise<void> {
    try {
      this.logger.log(
        `Processing country.deleted event for country ${data.id}`,
      );

      const result = await this.countryRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`Country ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted country ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete country ${data.id}:`, error);
      throw error;
    }
  }

  async handleUpsertCity(data: City): Promise<City> {
    try {
      this.logger.log(`Processing city upsert for city ${data.id}`);

      const existing = await this.cityRepository.findOne({
        where: { id: data.id },
      });

      let saved: City;

      if (existing === null) {
        this.logger.log(`City with id ${data.id} not found, creating new city`);
        const city = new City();
        Object.assign(city, data);
        saved = await this.cityRepository.save(city);
        this.logger.log(`Successfully created city ${data.id}`);
      } else {
        this.logger.log(
          `City with id ${data.id} found, updating existing city`,
        );
        Object.assign(existing, data);
        saved = await this.cityRepository.save(existing);
        this.logger.log(`Successfully updated city ${data.id}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to upsert city ${data.id}:`, error);
      throw error;
    }
  }

  async handleDeleteCity(data: City): Promise<void> {
    try {
      this.logger.log(`Processing city.deleted event for city ${data.id}`);

      const result = await this.cityRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`City ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted city ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete city ${data.id}:`, error);
      throw error;
    }
  }

  async handleUpsertJob(data: JobEntity): Promise<JobEntity> {
    try {
      this.logger.log(`Processing job upsert for job ${data.id}`);

      const existing = await this.jobEntityRepository.findOne({
        where: { id: data.id },
      });

      let saved: JobEntity;

      if (existing === null) {
        this.logger.log(`Job with id ${data.id} not found, creating new job`);
        const job = new JobEntity();
        Object.assign(job, data);
        saved = await this.jobEntityRepository.save(job);
        this.logger.log(`Successfully created job ${data.id}`);
      } else {
        this.logger.log(`Job with id ${data.id} found, updating existing job`);
        Object.assign(existing, data);
        saved = await this.jobEntityRepository.save(existing);
        this.logger.log(`Successfully updated job ${data.id}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to upsert job ${data.id}:`, error);
      throw error;
    }
  }

  async handleDeleteJob(data: JobEntity): Promise<void> {
    try {
      this.logger.log(`Processing job.deleted event for job ${data.id}`);

      const result = await this.jobEntityRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`Job ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted job ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete job ${data.id}:`, error);
      throw error;
    }
  }

  async handleUpsertTvaRate(data: TvaRate): Promise<TvaRate> {
    try {
      this.logger.log(`Processing TVA rate upsert for TVA rate ${data.id}`);

      const existing = await this.tvaRateRepository.findOne({
        where: { id: data.id },
      });

      let saved: TvaRate;

      if (existing === null) {
        this.logger.log(
          `TVA rate with id ${data.id} not found, creating new TVA rate`,
        );
        const tvaRate = new TvaRate();
        Object.assign(tvaRate, data);
        saved = await this.tvaRateRepository.save(tvaRate);
        this.logger.log(`Successfully created TVA rate ${data.id}`);
      } else {
        this.logger.log(
          `TVA rate with id ${data.id} found, updating existing TVA rate`,
        );
        Object.assign(existing, data);
        saved = await this.tvaRateRepository.save(existing);
        this.logger.log(`Successfully updated TVA rate ${data.id}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(`Failed to upsert TVA rate ${data.id}:`, error);
      throw error;
    }
  }

  async handleDeleteTvaRate(data: TvaRate): Promise<void> {
    try {
      this.logger.log(
        `Processing TVA rate.deleted event for TVA rate ${data.id}`,
      );

      const result = await this.tvaRateRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`TVA rate ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted TVA rate ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete TVA rate ${data.id}:`, error);
      throw error;
    }
  }

  async handleUpsertConditionRegulation(
    data: ConditionRegulation,
  ): Promise<ConditionRegulation> {
    try {
      this.logger.log(
        `Processing condition regulation upsert for condition regulation ${data.id}`,
      );

      const existing = await this.conditionRegulationRepository.findOne({
        where: { id: data.id },
      });

      let saved: ConditionRegulation;

      if (existing === null) {
        this.logger.log(
          `Condition regulation with id ${data.id} not found, creating new condition regulation`,
        );
        const conditionRegulation = new ConditionRegulation();
        Object.assign(conditionRegulation, data);
        saved =
          await this.conditionRegulationRepository.save(conditionRegulation);
        this.logger.log(`Successfully created condition regulation ${data.id}`);
      } else {
        this.logger.log(
          `Condition regulation with id ${data.id} found, updating existing condition regulation`,
        );
        Object.assign(existing, data);
        saved = await this.conditionRegulationRepository.save(existing);
        this.logger.log(`Successfully updated condition regulation ${data.id}`);
      }

      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to upsert condition regulation ${data.id}:`,
        error,
      );
      throw error;
    }
  }

  async handleDeleteConditionRegulation(
    data: ConditionRegulation,
  ): Promise<void> {
    try {
      this.logger.log(
        `Processing condition regulation.deleted event for condition regulation ${data.id}`,
      );

      const result = await this.conditionRegulationRepository.softDelete({
        id: data.id,
      });

      if (result.affected === 0) {
        this.logger.warn(
          `Condition regulation ${data.id} not found for deletion`,
        );
        return;
      }

      this.logger.log(`Successfully deleted condition regulation ${data.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete condition regulation ${data.id}:`,
        error,
      );
      throw error;
    }
  }

  async handleCatalogPublish(data: CatalogInterface): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(
        `Processing catalog.published event for catalog ${data.id}`,
      );

      const catalogData = await this.upsertCatalog(data, queryRunner);

      await this.upsertFamilies(
        data.families || [],
        catalogData.catalogId,
        queryRunner,
      );

      await this.upsertArticles(
        data.articles || [],
        catalogData.catalogId,
        queryRunner,
      );

      await this.upsertOuvrages(
        data.ouvrages || [],
        catalogData.catalogId,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      this.logger.log(
        `Successfully processed catalog.published event for catalog ${data.id}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to process catalog.published event for catalog ${data.id}:`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handleTenantCatalogsUpsert(data: CatalogTenantUpsert[]): Promise<void> {
    this.logger.log(
      'Received catalog_tenants.upsert event count : ',
      data.length,
    );

    for (const item of data) {
      try {
        await this.upsertTenantCatalog(item);
      } catch (error) {
        this.logger.error('Failed to process catalog tenant upsert', {
          tenantId: item.tenantId,
          catalogId: item.catalogId,
          error,
        });
        throw error;
      }
    }
  }

  private async upsertTenantCatalog(data: CatalogTenantUpsert) {
    const catalogSource = await this.catalogEntityRepository.findOne({
      where: { catalogId: data.catalogId, tenantId: NIL },
    });

    if (!catalogSource) {
      this.logger.warn(
        `Catalog with id ${data.catalogId} copie of GMS not found`,
      );
      return null;
    }

    const catalogTenant = await this.catalogEntityRepository.findOne({
      where: { catalogId: data.catalogId, tenantId: data.tenantId },
    });

    if (catalogTenant) {
      this.event.sendSynchro(SynchroMessageType.TENANT_CATALOG_SYNCHRO, {
        tenantId: data.tenantId,
        catalogId: data.catalogId,
      });

      this.logger.log(
        `Catalog ${data.catalogId} already exists for tenant ${data.tenantId}`,
      );

      return null;
    }

    const catalogEntity = new CatalogEntity();
    Object.assign(catalogEntity, {
      catalogId: catalogSource.catalogId,
      description: null,
      name: null,
      tenantId: data.tenantId,
    });

    this.logger.log(
      `Creating new catalog ${data.catalogId} copie for tenant ${data.tenantId}`,
    );

    const savedCatalog = await this.catalogEntityRepository.save(catalogEntity);

    this.event.sendSynchro(SynchroMessageType.TENANT_CATALOG_SYNCHRO, {
      tenantId: data.tenantId,
      catalogId: savedCatalog.catalogId,
    });

    return savedCatalog;
  }

  private async upsertCatalog(
    catalogData: CatalogInterface,
    queryRunner: QueryRunner,
  ): Promise<CatalogEntity> {
    const existingCatalog = await queryRunner.manager.findOne(CatalogEntity, {
      where: { catalogId: catalogData.id, tenantId: NIL },
    });

    let catalog: CatalogEntity;

    if (existingCatalog) {
      this.logger.log(`Catalog ${catalogData.id} already exists, updating`);
      Object.assign(existingCatalog, {
        name: catalogData.name,
        isDeleted: catalogData.isDeleted,
        description: catalogData.description,
      });
      catalog = await queryRunner.manager.save(existingCatalog);
    } else {
      this.logger.log(`Creating new catalog ${catalogData.id}`);
      catalog = queryRunner.manager.create(CatalogEntity, {
        catalogId: catalogData.id,
        isDeleted: catalogData.isDeleted,
        name: catalogData.name,
        description: catalogData.description,
        tenantId: NIL,
      });
      catalog = await queryRunner.manager.save(catalog);
    }

    return catalog;
  }

  private async upsertFamilies(
    familiesData: FamilyInterface[],
    catalogDbId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    this.logger.log(`Processing ${familiesData.length} families`);

    const familyMap = new Map<string, Family>();

    for (const familyData of familiesData) {
      const existingFamily = await queryRunner.manager.findOne(Family, {
        where: { familyId: familyData.id, tenantId: NIL },
      });

      let family: Family;

      if (existingFamily) {
        this.logger.log(`Family ${familyData.id} already exists, updating`);
        Object.assign(existingFamily, {
          name: familyData.name,
          isDeleted: familyData.isDeleted,
          catalogId: catalogDbId,
          tenantId: NIL,
        });
        family = await queryRunner.manager.save(existingFamily);
      } else {
        this.logger.log(`Creating new family ${familyData.id}`);
        family = queryRunner.manager.create(Family, {
          familyId: familyData.id,
          name: familyData.name,
          catalogId: catalogDbId,
          isDeleted: familyData.isDeleted,
          tenantId: NIL,
          parentId: null,
        });
        family = await queryRunner.manager.save(family);
      }

      familyMap.set(familyData.id, family);
    }

    for (const familyData of familiesData) {
      if (familyData.parentId) {
        const childFamily = familyMap.get(familyData.id);
        const parentFamily = familyMap.get(familyData.parentId);

        if (childFamily && parentFamily) {
          childFamily.parentId = parentFamily.familyId;
          childFamily.parentTenantId = NIL;
          await queryRunner.manager.save(childFamily);
          this.logger.log(
            `Set parent relationship: ${familyData.id} -> ${familyData.parentId}`,
          );
        }
      }
    }
  }

  private async upsertArticles(
    articlesData: ArticleInterface[],
    catalogDbId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    this.logger.log(`Processing ${articlesData.length} articles`);

    for (const articleData of articlesData) {
      const existingArticle = await queryRunner.manager.findOne(ArticleEntity, {
        where: { articleId: articleData.id, tenantId: NIL },
      });

      let article: ArticleEntity;

      if (existingArticle) {
        this.logger.log(`Article ${articleData.id} already exists, updating`);
        Object.assign(existingArticle, {
          saleUnitId: articleData.saleUnitId,
          purchaseUnitId: articleData.purchaseUnitId,
          articleNatureId: articleData.articleNatureId,
          catalogId: catalogDbId,
          code: articleData.code,
          name: articleData.name,
          label: articleData.label,
          commercialDescription: articleData.commercialDescription,
          photo: articleData.photo,
          lastPurchasePriceUpdateDate: articleData.lastPurchasePriceUpdateDate,
          lastSellingPriceUpdateDate: articleData.lastSellingPriceUpdateDate,
          purchasePrice: articleData.purchasePrice,
          margin: articleData.margin,
          sellingPrice: articleData.sellingPrice,
          conversionCoefficient: articleData.conversionCoefficient,
          isDeleted: articleData.isDeleted,
          tenantId: NIL,
        });
        article = await queryRunner.manager.save(existingArticle);
      } else {
        this.logger.log(`Creating new article ${articleData.id}`);
        article = queryRunner.manager.create(ArticleEntity, {
          articleId: articleData.id,
          saleUnitId: articleData.saleUnitId,
          purchaseUnitId: articleData.purchaseUnitId,
          articleNatureId: articleData.articleNatureId,
          catalogId: catalogDbId,
          code: articleData.code,
          name: articleData.name,
          label: articleData.label,
          commercialDescription: articleData.commercialDescription,
          photo: articleData.photo,
          lastPurchasePriceUpdateDate: articleData.lastPurchasePriceUpdateDate,
          lastSellingPriceUpdateDate: articleData.lastSellingPriceUpdateDate,
          purchasePrice: articleData.purchasePrice,
          margin: articleData.margin,
          sellingPrice: articleData.sellingPrice,
          conversionCoefficient: articleData.conversionCoefficient,
          isDeleted: articleData.isDeleted,
          tenantId: NIL,
        });
        article = await queryRunner.manager.save(article);
      }

      await this.linkArticleToFamilies(
        article,
        articleData.familiesIds || [],
        queryRunner,
      );
    }
  }

  private async linkArticleToFamilies(
    article: ArticleEntity,
    familiesIds: string[],
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (familiesIds.length === 0) return;

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(FamilyArticle)
      .where('articleId = :articleId AND articleTenantId = :tenantId', {
        articleId: article.articleId,
        tenantId: NIL,
      })
      .execute();

    for (const familyId of familiesIds) {
      const family = await queryRunner.manager.findOne(Family, {
        where: { familyId: familyId, tenantId: NIL },
      });

      if (family) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(FamilyArticle)
          .values({
            familyId: family.familyId,
            articleId: article.articleId,
            catalogId: family.catalogId,
            articleTenantId: NIL,
            familyTenantId: NIL,
          })
          .execute();
      }
    }
  }

  private async upsertOuvrages(
    ouvragesData: OuvrageInterface[],
    catalogDbId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    this.logger.log(`Processing ${ouvragesData.length} ouvrages`);

    for (const ouvrageData of ouvragesData) {
      const existingOuvrage = await queryRunner.manager.findOne(Ouvrage, {
        where: { ouvrageId: ouvrageData.id, tenantId: NIL },
      });

      let ouvrage: Ouvrage;

      if (existingOuvrage) {
        this.logger.log(`Ouvrage ${ouvrageData.id} already exists, updating`);
        Object.assign(existingOuvrage, {
          unitId: ouvrageData.unitId,
          designation: ouvrageData.designation,
          prix: ouvrageData.prix,
          catalogId: catalogDbId,
          isDeleted: ouvrageData.isDeleted,
          tenantId: NIL,
        });
        ouvrage = await queryRunner.manager.save(existingOuvrage);
      } else {
        this.logger.log(`Creating new ouvrage ${ouvrageData.id}`);
        ouvrage = queryRunner.manager.create(Ouvrage, {
          unitId: ouvrageData.unitId,
          ouvrageId: ouvrageData.id,
          designation: ouvrageData.designation,
          prix: ouvrageData.prix,
          catalogId: catalogDbId,
          isDeleted: ouvrageData.isDeleted,
          tenantId: NIL,
        });
        ouvrage = await queryRunner.manager.save(ouvrage);
      }

      await this.linkOuvrageToFamilies(
        ouvrage,
        ouvrageData.familiesIds || [],
        queryRunner,
      );

      await this.upsertLignesOuvrage(
        ouvrageData.lignesOuvrage || [],
        ouvrage,
        queryRunner,
      );
    }
  }

  private async linkOuvrageToFamilies(
    ouvrage: Ouvrage,
    familiesIds: string[],
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (familiesIds.length === 0) return;
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from('family_ouvrage')
      .where('ouvrageId = :ouvrageId AND ouvrageTenantId = :tenantId', {
        ouvrageId: ouvrage.ouvrageId,
        tenantId: NIL,
      })
      .execute();

    for (const familyId of familiesIds) {
      const family = await queryRunner.manager.findOne(Family, {
        where: { familyId: familyId, tenantId: NIL },
      });

      if (family) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(FamilyOuvrage)
          .values({
            familyId: family.familyId,
            ouvrageId: ouvrage.ouvrageId,
            catalogId: family.catalogId,
            ouvrageTenantId: NIL,
            familyTenantId: NIL,
          })
          .execute();
      }
    }
  }

  private async upsertLignesOuvrage(
    lignesData: LigneOuvrageInterface[],
    ouvrage: Ouvrage,
    queryRunner: QueryRunner,
  ): Promise<void> {
    this.logger.log(`Processing ${lignesData.length} lignes ouvrage`);

    for (const ligneData of lignesData) {
      const existingLigne = await queryRunner.manager.findOne(LigneOuvrage, {
        where: { ligneOuvrageId: ligneData.id, tenantId: NIL },
      });

      let ligne: LigneOuvrage;

      if (existingLigne) {
        this.logger.log(
          `Ligne ouvrage ${ligneData.id} already exists, updating`,
        );
        Object.assign(existingLigne, {
          noOrdre: ligneData.noOrdre,
          typeLigneOuvrage: ligneData.typeLigneOuvrage,
          ouvrageId: ouvrage.ouvrageId,
          isDeleted: ligneData.isDeleted,
        });
        ligne = await queryRunner.manager.save(existingLigne);
      } else {
        this.logger.log(`Creating new ligne ouvrage ${ligneData.id}`);
        ligne = queryRunner.manager.create(LigneOuvrage, {
          ligneOuvrageId: ligneData.id,
          ouvrageId: ouvrage.ouvrageId,
          catalogId: ouvrage.catalogId,
          isDeleted: ligneData.isDeleted,
          tenantId: NIL,
          noOrdre: ligneData.noOrdre,
          typeLigneOuvrage: ligneData.typeLigneOuvrage,
        });
        ligne = await queryRunner.manager.save(ligne);
      }

      if (ligneData.commentaire) {
        await this.upsertCommentaire(ligneData.commentaire, ligne, queryRunner);
      }

      if (ligneData.ligneOuvrageArticle) {
        await this.upsertLigneOuvrageArticle(
          ligneData.ligneOuvrageArticle,
          ligne.ligneOuvrageId,
          ouvrage,
          queryRunner,
        );
      }
    }
  }

  private async upsertCommentaire(
    commentaireData: CommentaireInterface,
    ligne: LigneOuvrage,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const existingCommentaire = await queryRunner.manager.findOne(Commentaire, {
      where: { commentaireId: commentaireData.id, tenantId: NIL },
    });

    let commentaire: Commentaire;

    if (existingCommentaire) {
      this.logger.log(
        `Commentaire ${commentaireData.id} already exists, updating`,
      );
      Object.assign(existingCommentaire, {
        description: commentaireData.description,
        isDeleted: commentaireData.isDeleted,
      });
      commentaire = await queryRunner.manager.save(existingCommentaire);
    } else {
      this.logger.log(`Creating new commentaire ${commentaireData.id}`);
      commentaire = queryRunner.manager.create(Commentaire, {
        commentaireId: commentaireData.id,
        isDeleted: commentaireData.isDeleted,
        tenantId: NIL,
        description: commentaireData.description,
      });
      commentaire = await queryRunner.manager.save(commentaire);
    }

    ligne.commentaire = commentaire;
    await queryRunner.manager.save(ligne);
  }

  private async upsertLigneOuvrageArticle(
    ligneArticleData: LigneOuvrageArticleInterface,
    ligneOuvrageDbId: string,
    ouvrage: Ouvrage,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const existingLigneArticle = await queryRunner.manager.findOne(
      LigneOuvrageArticle,
      {
        where: {
          ligneOuvrageArticleId: ligneArticleData.id,
          tenantId: NIL,
        },
      },
    );

    const article = await queryRunner.manager.findOne(ArticleEntity, {
      where: { articleId: ligneArticleData.articleId, tenantId: NIL },
    });

    if (!article) {
      this.logger.warn(
        `Article ${ligneArticleData.articleId} not found for ligne ouvrage article ${ligneArticleData.id}`,
      );

      throw new Error(
        `Article ${ligneArticleData.articleId} not found for ligne ouvrage article ${ligneArticleData.id}`,
      );
    }

    if (existingLigneArticle) {
      this.logger.log(
        `Ligne ouvrage article ${ligneArticleData.id} already exists, updating`,
      );
      Object.assign(existingLigneArticle, {
        quantite: ligneArticleData.quantite,
        articleId: article.articleId,
        isDeleted: ligneArticleData.isDeleted,
      });
      await queryRunner.manager.save(existingLigneArticle);
    } else {
      this.logger.log(
        `Creating new ligne ouvrage article ${ligneArticleData.id}`,
      );
      const ligneArticle = queryRunner.manager.create(LigneOuvrageArticle, {
        ligneOuvrageArticleId: ligneArticleData.id,
        ligneOuvrageId: ligneOuvrageDbId,
        ouvrageId: ouvrage.ouvrageId,
        catalogId: ouvrage.catalogId,
        isDeleted: ligneArticleData.isDeleted,
        tenantId: NIL,
        articleId: article.articleId,
        catalogArticleId: article.catalogId,
        tenantArticleId: NIL,

        quantite: ligneArticleData.quantite,
      });
      await queryRunner.manager.save(ligneArticle);
    }
  }

  async handleUserUpdated(
    data: UserEventDto,
    queryRunner?: QueryRunner,
  ): Promise<User> {
    try {
      let saved: User;
      console.log('start process for user ' + data.id);
      const user = await this.userRepository.findOne({
        where: { id: data.id },
      });

      if (user === null) {
        this.logger.log(`User with id ${data.id} not found, creating new user`);
        const user = new User();
        Object.assign(user, data);

        if (queryRunner) {
          saved = await queryRunner.manager.save(user);
        } else {
          saved = await this.userRepository.save(user);
          this.event.sendSynchro(SynchroMessageType.USER_SYNCHRO, {
            id: saved.id,
            timestamp: saved.timestamp,
          });
        }

        this.logger.log(`Successfully add user ${data.id}`);
        return saved;
      } else {
        Object.assign(user, data);
        if (queryRunner) {
          saved = await queryRunner.manager.save(user);
        } else {
          saved = await this.userRepository.save(user);
          this.event.sendSynchro(SynchroMessageType.USER_SYNCHRO, {
            id: saved.id,
            timestamp: saved.timestamp,
          });
        }

        this.logger.log(`Successfully updated user ${data.id}`);
        return saved;
      }
    } catch (error) {
      this.logger.error(`Failed to update user ${data.id}:`, error);
      throw error;
    }
  }

  async handleTenantUpdated({
    company: companyInfo,
    owner: ownerInfo,
    userCompany,
    ...tenantInfo
  }: TenantEventDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log('Starting tenant complete creation process', {
        tenantId: tenantInfo.id,
        ownerId: ownerInfo?.id,
        companyId: companyInfo?.id,
      });

      const existingTenant = await queryRunner.manager.findOne(Tenant, {
        where: { id: tenantInfo.id },
      });

      let tenant: Tenant;
      if (existingTenant) {
        this.logger.log(
          `Tenant ${tenantInfo.id} already exists, using existing`,
        );
        tenant = existingTenant;
        Object.assign(tenant, tenantInfo);
        tenant = await queryRunner.manager.save(tenant);
        this.logger.log(`Updated tenant ${tenant.id}`);
      } else {
        let tenant = new Tenant();
        Object.assign(tenant, tenantInfo);
        tenant = await queryRunner.manager.save(tenant);
        this.logger.log(`Created tenant ${tenant.id}`);
      }

      let owner: User | null = null;
      let company: Company | null = null;

      if (ownerInfo) {
        owner = await this.handleUserUpdated(ownerInfo, queryRunner);
      }

      if (companyInfo) {
        company = await this.handleCompanyUpdated(companyInfo, queryRunner);
      }

      if (owner && company) {
        await this.handleCompanyUpdateUserRole(
          {
            idCompany: company.id,
            idUser: owner.id,
            isAdmin: true,
            timestamp: userCompany?.timestamp || owner.timestamp + 1000,
            targetGrappeId: tenantInfo.targetGrappeId,
          },
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      this.event.sendSynchro(SynchroMessageType.TENANT_SYNCHRO, {
        id: tenantInfo.id,
        timestamp: tenantInfo.timestamp,
      });

      if (owner) {
        this.event.sendSynchro(SynchroMessageType.USER_SYNCHRO, {
          id: owner.id,
          timestamp: owner.timestamp,
        });
      }

      if (company) {
        this.event.sendSynchro(SynchroMessageType.COMPANY_SYNCHRO, {
          id: company.id,
          timestamp: company.timestamp,
        });
      }

      if (owner && company) {
        this.event.sendSynchro(SynchroMessageType.USER_COMPANY_SYNCHRO, {
          idCompany: company.id,
          idUser: owner.id,
          timestamp: userCompany?.timestamp || owner.timestamp + 1000,
        });
      }

      this.logger.log('Successfully completed tenant creation process', {
        tenantId: tenantInfo.id,
        userId: ownerInfo?.id,
        companyId: companyInfo?.id,
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to process tenant.created_complete event:', {
        tenantId: tenantInfo.id,
        userId: ownerInfo?.id,
        companyId: companyInfo?.id,
        error: error.message,
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async handleCompanyUpdated(
    data: CompanyEventDto,
    query?: QueryRunner,
  ): Promise<Company> {
    let queryRunner: QueryRunner;
    if (query) {
      queryRunner = query;
    } else {
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }
    try {
      const company = await this.companyRepository.findOne({
        where: { id: data.id },
      });

      if (company === null) {
        this.logger.log(
          `Company with id ${data.id} not found, creating new company`,
        );

        const company = new Company();
        Object.assign(company, data);
        company.idHeadOffice = null;
        company.idBillingAddress = null;
        delete company.headOffice;
        delete company.billingAddress;
        const savedCompany = await queryRunner.manager.save(company);

        if (data.headOffice) {
          let city: City | null = null;
          if (data.headOffice.idCity) {
            city = await queryRunner.manager.findOne(City, {
              where: { id: data.headOffice.idCity },
            });
          }

          savedCompany.headOffice = await queryRunner.manager.save(Address, {
            ...data.headOffice,
            idCity: city ? city.id : null,
            idTenant: company.idTenant,
          });
        }

        if (data.billingAddress) {
          let city: City | null = null;
          if (data.billingAddress.idCity) {
            city = await queryRunner.manager.findOne(City, {
              where: { id: data.billingAddress.idCity },
            });
          }

          savedCompany.billingAddress = await queryRunner.manager.save(
            Address,
            {
              ...data.billingAddress,
              idCity: city ? city.id : null,
              idTenant: company.idTenant,
            },
          );
        }

        await queryRunner.manager.save(savedCompany);

        const directory = queryRunner.manager.create(Directory, {
          idTenant: data.idTenant,
          name: `${data.name}`,
        });

        const savedDirectory = await queryRunner.manager.save(directory);

        const directoryCompany = queryRunner.manager.create(DirectoryCompany, {
          idDirectory: savedDirectory.id,
          idCompany: savedCompany.id,
          isDefault: true,
        });

        await queryRunner.manager.save(directoryCompany);

        this.numberingService.create(
          {
            idCustomerDirectory: savedDirectory.id,
            format: DefaultFormats.CUSTOMER,
          },
          queryRunner,
        );

        if (!query) {
          await queryRunner.commitTransaction();
          this.event.sendSynchro(SynchroMessageType.COMPANY_SYNCHRO, {
            id: savedCompany.id,
            timestamp: savedCompany.timestamp,
          });
          await queryRunner.release();
        }
        this.logger.log(
          `Successfully created company ${data.id} with default directory ${savedDirectory.id}`,
        );

        return savedCompany;
      } else {
        Object.assign(company, data);
        company.idHeadOffice = null;
        company.idBillingAddress = null;
        delete company.headOffice;
        delete company.billingAddress;
        const savedCompany = await queryRunner.manager.save(company);

        if (data.headOffice) {
          let city: City | null = null;
          if (data.headOffice.idCity) {
            city = await queryRunner.manager.findOne(City, {
              where: { id: data.headOffice.idCity },
            });
          }

          savedCompany.headOffice = await queryRunner.manager.save(Address, {
            ...data.headOffice,
            idCity: city ? city.id : null,
            idTenant: company.idTenant,
          });
        }

        if (data.billingAddress) {
          let city: City | null = null;
          if (data.billingAddress.idCity) {
            city = await queryRunner.manager.findOne(City, {
              where: { id: data.billingAddress.idCity },
            });
          }

          savedCompany.billingAddress = await queryRunner.manager.save(
            Address,
            {
              ...data.billingAddress,
              idCity: city ? city.id : null,
              idTenant: company.idTenant,
            },
          );
        }

        await queryRunner.manager.save(savedCompany);

        if (!query) {
          await queryRunner.commitTransaction();
          this.event.sendSynchro(SynchroMessageType.COMPANY_SYNCHRO, {
            id: savedCompany.id,
            timestamp: savedCompany.timestamp,
          });
          await queryRunner.release();
        }
        this.logger.log(`Successfully updated company ${data.id}`);
        return savedCompany;
      }
    } catch (error) {
      if (!query) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
      }
      this.logger.error(`Failed to update company ${data.id}:`, error);
      throw error;
    }
  }

  async handleCompanyUpdateUserRole(
    data: UserCompanyEventDto,
    query?: QueryRunner,
  ): Promise<void> {
    try {
      const userCompany = await this.userCompanyRepository.findOne({
        where: {
          idCompany: data.idCompany,
          idUser: data.idUser,
        },
      });

      if (userCompany === null) {
        this.logger.log(
          `Relation between user ${data.idUser} and company ${data.idCompany} not found, creating new relation`,
        );

        const userCompany = this.userCompanyRepository.create({
          idCompany: data.idCompany,
          idUser: data.idUser,
          isAdmin: data.isAdmin,
        });

        if (query) {
          await query.manager.save(userCompany);
        } else {
          const saved = await this.userCompanyRepository.save(userCompany);
          this.event.sendSynchro(SynchroMessageType.USER_COMPANY_SYNCHRO, {
            idUser: saved.idUser,
            idCompany: saved.idCompany,
            timestamp: saved.timestamp,
          });
        }

        this.logger.log(
          `Successfully added user ${data.idUser} to company ${data.idCompany}`,
        );
        return;
      } else {
        if (query) {
          await query.manager.save({ ...userCompany, isAdmin: data.isAdmin });
        } else {
          await this.userCompanyRepository.update(
            {
              idCompany: data.idCompany,
              idUser: data.idUser,
            },
            {
              isAdmin: data.isAdmin,
              timestamp: data.timestamp,
            },
          );

          this.event.sendSynchro(SynchroMessageType.USER_COMPANY_SYNCHRO, {
            idUser: data.idUser,
            idCompany: data.idCompany,
            timestamp: data.timestamp,
          });
        }

        this.logger.log(
          `Successfully updated role for user ${data.idUser} in company ${data.idCompany}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update role for user ${data.idUser} in company ${data.idCompany}:`,
        error,
      );
      throw error;
    }
  }

  async handleCompanyRemoveUser(data: UserCompanyEventDto): Promise<void> {
    try {
      const result = await this.userCompanyRepository.delete({
        idCompany: data.idCompany,
        idUser: data.idUser,
      });

      if (result.affected === 0) {
        this.logger.warn(
          `No relation found between user ${data.idUser} and company ${data.idCompany} to remove`,
        );
        return;
      }

      this.logger.log(
        `Successfully removed user ${data.idUser} from company ${data.idCompany}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove user ${data.idUser} from company ${data.idCompany}:`,
        error,
      );
      throw error;
    }
  }

  async handleCompaniesUpdated(data: CompanyEventDto[]) {
    this.logger.log('Received companies.updated event count : ', data.length);
    for (const company of data) {
      try {
        await this.handleCompanyUpdated(company);
        this.logger.log('Successfully processed company.updated event', {
          companyId: company.id,
        });
      } catch (error) {
        this.logger.error('Failed to process company.updated event', {
          companyId: company.id,
          error: error.message,
        });
        throw error;
      }
    }
  }

  async handleCompaniesUpdateUserRole(data: UserCompanyEventDto[]) {
    this.logger.log('Received companies.update_user_role event');

    for (const userCompany of data) {
      try {
        await this.handleCompanyUpdateUserRole(userCompany);
        this.logger.log(
          'Successfully processed company.update_user_role event',
          {
            companyId: userCompany.idCompany,
            userId: userCompany.idUser,
          },
        );
      } catch (error) {
        this.logger.error('Failed to process company.update_user_role event', {
          companyId: userCompany.idCompany,
          userId: userCompany.idUser,
          error: error.message,
        });
        throw error;
      }
    }
  }

  async handleUsersUpdated(data: UserEventDto[]) {
    this.logger.log('Received users.updated event count : ', data.length);
    for (const user of data) {
      try {
        console.log('user' + user.id);
        await this.handleUserUpdated(user);
        this.logger.log('Successfully processed user.updated event', {
          userId: user.id,
        });
      } catch (error) {
        this.logger.error('Failed to process user.updated event', {
          userId: user.id,
          error: error.message,
        });
        throw error;
      }
    }
  }

  async handleTenantsUpdated(data: TenantEventDto[]) {
    this.logger.log('Received tenants.updated event count : ', data.length);
    for (const tenant of data) {
      try {
        console.log('tenant' + tenant.id);
        await this.handleTenantUpdated(tenant);
        this.logger.log('Successfully processed tenant.updated event', {
          tenantId: tenant.id,
        });
      } catch (error) {
        this.logger.error('Failed to process user.updated event', {
          tenantId: tenant.id,
          error: error.message,
        });
        throw error;
      }
    }
  }

  async handleUserDeleted(data: UserEventDto): Promise<void> {
    try {
      this.logger.log(`Processing user.deleted event for user ${data.id}`);

      const result = await this.userRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`User ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted user ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${data.id}:`, error);
      throw error;
    }
  }

  async handleTenantDeleted(data: TenantEventDto): Promise<void> {
    try {
      this.logger.log(`Processing tenant.deleted event for tenant ${data.id}`);
      const tenant = await this.tenantRepository.findOne({
        where: { id: data.id },
        relations: { companies: true, users: true },
      });

      if (tenant?.companies) {
        for (let i = 0; i < tenant.companies.length; i++) {
          const company = tenant.companies[i];
          await this.companyRepository.softDelete({ id: company.id });
        }
      }

      if (tenant?.users) {
        for (let i = 0; i < tenant.users.length; i++) {
          const user = tenant.users[i];
          await this.userRepository.softDelete({ id: user.id });
        }
      }

      const result = await this.tenantRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`Tenant ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted tenant ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete tenant ${data.id}:`, error);
      throw error;
    }
  }

  async handleCompanyDeleted(data: CompanyEventDto): Promise<void> {
    try {
      this.logger.log(
        `Processing company.deleted event for company ${data.id}`,
      );

      const result = await this.companyRepository.softDelete({ id: data.id });

      if (result.affected === 0) {
        this.logger.warn(`Company ${data.id} not found for deletion`);
        return;
      }

      this.logger.log(`Successfully deleted company ${data.id}`);
    } catch (error) {
      this.logger.error(`Failed to delete company ${data.id}:`, error);
      throw error;
    }
  }
}
