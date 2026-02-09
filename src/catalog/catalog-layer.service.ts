import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleNature } from 'src/article-nature/entities/article-nature.entity';
import { ArticleLayerDto } from 'src/article/dto/article-layer.dto';
import { Commentaire } from 'src/commentaire/entities/commentaire.entity';
import { NIL } from 'src/common/constants';
import { FamilyLayerDto } from 'src/family/dto/family-layer.dto';
import { FamilyArticle } from 'src/family/entities/family-article.entity';
import { FamilyOuvrage } from 'src/family/entities/family-ouvrage.entity';
import { LigneOuvrageArticle } from 'src/ligne-ouvrage/entities/ligne-ouvrage-article.entity';
import {
  LigneOuvrage,
  TypeLigneOuvrage,
} from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import {
  LigneOuvrageArticleLayerDto,
  LigneOuvrageLayerDto,
  OuvrageLayerDto,
} from 'src/ouvrage/dto/ouvrage-layer.dto';
import { UnitEntity } from 'src/unit/entities/unit.entity';
import { DataSource, Not, QueryRunner, Repository } from 'typeorm';
import { ArticleEntity } from '../article/entities/article.entity';
import { Family } from '../family/entities/family.entity';
import { Ouvrage } from '../ouvrage/entities/ouvrage.entity';
import { CatalogEntity } from './entities/catalog.entity';
import { CatalogMergeService } from './catalog-merge.service';

@Injectable()
export class CatalogLayerService {
  private readonly logger = new Logger(CatalogLayerService.name);

  constructor(
    @InjectRepository(CatalogEntity)
    private readonly catalogRepository: Repository<CatalogEntity>,

    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,

    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,

    @InjectRepository(Ouvrage)
    private readonly ouvrageRepository: Repository<Ouvrage>,

    @InjectRepository(UnitEntity)
    private readonly unitEntityRepository: Repository<UnitEntity>,

    @InjectRepository(ArticleNature)
    private readonly articleNatureRepository: Repository<ArticleNature>,

    @InjectRepository(FamilyArticle)
    private readonly familyArticleRepository: Repository<FamilyArticle>,

    @InjectRepository(FamilyOuvrage)
    private readonly familyOuvrageRepository: Repository<FamilyOuvrage>,

    @InjectRepository(LigneOuvrage)
    private readonly ligneOuvrageRepository: Repository<LigneOuvrage>,

    @InjectRepository(LigneOuvrageArticle)
    private readonly ligneOuvrageArticleRepository: Repository<LigneOuvrageArticle>,

    private readonly catalogMergeService: CatalogMergeService,

    private readonly dataSource: DataSource,
  ) {}

  async removeCatalog(catalogId: string, tenantId: string) {
    const catalog = await this.catalogRepository.findOne({
      where: { catalogId, tenantId },
    });

    if (!catalog) {
      throw new NotFoundException('Catalogue non trouvé');
    }

    const articles = await this.catalogMergeService.getArticlesForCatalog(
      catalogId,
      tenantId,
    );

    const ouvrages = await this.catalogMergeService.getOuvragesForCatalog(
      catalogId,
      tenantId,
    );

    const families = await this.catalogMergeService.getAllFamiliesForCatalog(
      catalogId,
      tenantId,
    );

    if (articles.filter((item) => !item.isDeleted).length > 0) {
      throw new BadRequestException('Le catalogue contient des articles');
    }

    if (ouvrages.filter((item) => !item.isDeleted).length > 0) {
      throw new BadRequestException('Le catalogue contient des ouvrages');
    }

    if (families.filter((item) => !item.isDeleted).length > 0) {
      throw new BadRequestException('Le catalogue contient des familles');
    }

    catalog.isDeleted = true;

    await this.catalogRepository.save(catalog);
  }

  async removeArticle(articleId: string, tenantId: string) {
    const article = await this.articleRepository.findOne({
      where: { articleId, tenantId },
    });

    if (article) {
      article.isDeleted = true;
      await this.articleRepository.save(article);
    } else {
      const articleSource = await this.articleRepository.findOne({
        where: { articleId, tenantId: NIL },
      });

      if (!articleSource) {
        throw new NotFoundException('Article non trouvé');
      }

      const article = new ArticleEntity();
      article.articleId = articleSource.articleId;
      article.catalogId = articleSource.catalogId;
      article.code = articleSource.code;
      article.tenantId = tenantId;
      article.isDeleted = true;
      await this.articleRepository.save(article);
    }
  }

  async removeFamily(familyId: string, tenantId: string) {
    const family = await this.familyRepository.findOne({
      where: { familyId, tenantId },
    });

    const children = await this.catalogMergeService.getSubFamilies(
      familyId,
      tenantId,
    );

    const articles = await this.catalogMergeService.getArticlesForFamily(
      familyId,
      tenantId,
    );

    const ouvrages = await this.catalogMergeService.getOuvragesForFamily(
      familyId,
      tenantId,
    );

    if (articles.filter((item) => !item.isDeleted).length > 0) {
      throw new BadRequestException('La famille contient des articles');
    }

    if (ouvrages.filter((item) => !item.isDeleted).length > 0) {
      throw new BadRequestException('La famille contient des ouvrages');
    }

    if (children.filter((item) => !item.isDeleted).length > 0) {
      throw new BadRequestException('La famille contient des sous familles');
    }

    if (family) {
      family.isDeleted = true;
      await this.familyRepository.save(family);
    } else {
      const familySource = await this.familyRepository.findOne({
        where: { familyId, tenantId: NIL },
      });

      if (!familySource) {
        throw new NotFoundException('Famille non trouvé');
      }

      const family = new Family();
      family.familyId = familySource.familyId;
      family.tenantId = tenantId;
      family.parentId = familySource.parentId;
      family.parentTenantId = familySource.parentTenantId;
      family.catalogId = familySource.catalogId;
      family.isDeleted = true;
      await this.familyRepository.save(family);
    }
  }

  async removeOuvrage(ouvrageId: string, tenantId: string) {
    const ouvrage = await this.ouvrageRepository.findOne({
      where: { ouvrageId, tenantId },
    });

    if (ouvrage) {
      ouvrage.isDeleted = true;
      await this.ouvrageRepository.save(ouvrage);
    } else {
      const ouvrageSource = await this.ouvrageRepository.findOne({
        where: { ouvrageId, tenantId: NIL },
      });

      if (!ouvrageSource) {
        throw new NotFoundException('Ouvrage non trouvé');
      }

      const ouvrage = new Ouvrage();
      ouvrage.ouvrageId = ouvrageSource.ouvrageId;
      ouvrage.catalogId = ouvrageSource.catalogId;
      ouvrage.tenantId = tenantId;
      ouvrage.isDeleted = true;
      await this.ouvrageRepository.save(ouvrage);
    }
  }

  async saveFamily(dto: FamilyLayerDto, tenantId: string): Promise<Family> {
    const catalog = await this.findCatalog(dto.catalogId, tenantId);

    let family = new Family();
    if (dto.familyId) {
      const [baseFamily, fallbackFamily] = await Promise.all([
        this.findFamilyByIdAndTenant(dto.familyId, tenantId),
        this.findFamilyByIdAndTenant(dto.familyId, null),
      ]);

      if (!baseFamily && !fallbackFamily) {
        this.logger.log(`Family from id ${dto.familyId} not found`);
        throw new NotFoundException('Famille non trouvée');
      }

      if (baseFamily) {
        family = this.overwriteFamily(dto, baseFamily, fallbackFamily);
      } else if (fallbackFamily) {
        family.familyId = fallbackFamily.familyId;
        family.catalogId = catalog.catalogId;
        family.tenantId = tenantId;
        family = this.overwriteFamily(dto, family, fallbackFamily);
      }
    } else {
      family = this.overwriteFamily(dto, family, null);
      family.catalogId = catalog.catalogId;
      family.tenantId = tenantId;
    }

    if (dto.parentId) {
      family.parent = await this.findFamily(dto.parentId, tenantId);
    }

    const data = await this.familyRepository.find({
      where: {
        name: family.name as string,
        tenantId: tenantId,
        catalogId: family.catalogId,
        familyId: Not(family.familyId),
        isDeleted: false,
      },
    });

    if (data.length > 0) {
      throw new ConflictException(
        `La famille avec le nom ${family.name} existe déjà sur ce catalogue`,
      );
    }

    const saved = await this.familyRepository.save(family);
    saved.catalogId = catalog.catalogId;

    return saved;
  }

  private async findCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<CatalogEntity> {
    const catalog = await this.catalogRepository
      .createQueryBuilder('catalog')
      .where('catalog.tenantId = :tenantId', { tenantId })
      .andWhere('catalog.catalogId = :catalogId', { catalogId })
      .getOne();

    if (!catalog) {
      this.logger.log(`Catalogue from id ${catalogId} not found`);
      throw new NotFoundException('Catalogue non trouvé');
    }

    return catalog;
  }

  private overwriteFamily(
    dto: FamilyLayerDto,
    base: Family,
    fallback: Family | null,
  ): Family {
    if (fallback) {
      base.name = this.getPropertyValue(dto, base, fallback, 'name');
    } else {
      base.name = dto.name;
    }

    return base;
  }

  private getPropertyValue(
    dto:
      | ArticleLayerDto
      | FamilyLayerDto
      | OuvrageLayerDto
      | LigneOuvrageLayerDto
      | LigneOuvrageArticleLayerDto,
    base: Family | ArticleEntity | Ouvrage | LigneOuvrage | LigneOuvrageArticle,
    fallback:
      | Family
      | ArticleEntity
      | Ouvrage
      | LigneOuvrage
      | LigneOuvrageArticle,
    property: string,
  ): any {
    if (base) {
      return (base[property] === null || base[property] === undefined) &&
        dto[property] === fallback[property]
        ? null
        : dto[property];
    }
    return null;
  }

  private async overwriteArticleNature(
    dto: ArticleLayerDto,
    base: ArticleEntity,
    fallback: ArticleEntity | null,
  ): Promise<ArticleNature | null> {
    if (dto.articleNatureId) {
      if (
        !fallback ||
        (!base.articleNatureId &&
          dto.articleNatureId !== fallback.articleNatureId)
      ) {
        const natureArticle = await this.articleNatureRepository.findOne({
          where: { id: dto.articleNatureId },
        });

        if (!natureArticle) {
          throw new NotFoundException(`Nature article non trouvée`);
        }

        return natureArticle;
      }
    }

    return null;
  }

  private async overwriteUnit(
    dto: ArticleLayerDto | OuvrageLayerDto,
    base: ArticleEntity | Ouvrage,
    fallback: ArticleEntity | Ouvrage | null,
    isSale?: boolean,
  ): Promise<UnitEntity | null> {
    let tag: string;
    switch (isSale) {
      case true:
        tag = 'saleUnitId';
        break;
      case false:
        tag = 'purchaseUnitId';
        break;
      default:
        tag = 'unitId';
    }

    if (dto[tag]) {
      if (!fallback || (!base[tag] && dto[tag] !== fallback[tag])) {
        const unit = await this.unitEntityRepository.findOne({
          where: { id: dto[tag] },
        });

        let message = '';

        if (isSale === true) {
          message = 'Unité de vente non trouvé.';
        } else if (isSale === false) {
          message = "Unité d'achat non trouvé.";
        } else {
          message = 'Unité non trouvé.';
        }

        if (!unit) {
          throw new NotFoundException(message);
        }

        return unit;
      }
    }

    return null;
  }

  private async overwriteArticle(
    dto: ArticleLayerDto,
    base: ArticleEntity,
    fallback: ArticleEntity | null,
  ): Promise<ArticleEntity> {
    if (dto.code) {
      base.code = dto.code;
    } else if (!base.code) {
      if (base.tenantId) {
        base.code = await this.generateUniqueCode(base.tenantId);
      }
    }

    base.articleNature = await this.overwriteArticleNature(dto, base, fallback);

    base.saleUnit = await this.overwriteUnit(dto, base, fallback, true);

    base.purchaseUnit = await this.overwriteUnit(dto, base, fallback, false);

    if (fallback) {
      base.name = this.getPropertyValue(dto, base, fallback, 'name');
      base.label = this.getPropertyValue(dto, base, fallback, 'label');
      base.margin = this.getPropertyValue(dto, base, fallback, 'margin');
      base.photo = this.getPropertyValue(dto, base, fallback, 'photo');
      base.commercialDescription = this.getPropertyValue(
        dto,
        base,
        fallback,
        'commercialDescription',
      );
      base.lastPurchasePriceUpdateDate = this.getPropertyValue(
        dto,
        base,
        fallback,
        'lastPurchasePriceUpdateDate',
      );
      base.lastSellingPriceUpdateDate = this.getPropertyValue(
        dto,
        base,
        fallback,
        'lastSellingPriceUpdateDate',
      );
      base.purchasePrice = this.getPropertyValue(
        dto,
        base,
        fallback,
        'purchasePrice',
      );
      base.sellingPrice = this.getPropertyValue(
        dto,
        base,
        fallback,
        'sellingPrice',
      );
      base.conversionCoefficient = this.getPropertyValue(
        dto,
        base,
        fallback,
        'conversionCoefficient',
      );
    } else {
      base.name = dto.name;
      base.label = dto.label;
      base.commercialDescription = dto.commercialDescription;
      base.photo = dto.photo;
      base.lastPurchasePriceUpdateDate = dto.lastPurchasePriceUpdateDate;
      base.lastSellingPriceUpdateDate = dto.lastSellingPriceUpdateDate;
      base.purchasePrice = dto.purchasePrice;
      base.margin = dto.margin;
      base.sellingPrice = dto.sellingPrice;
      base.conversionCoefficient = dto.conversionCoefficient;
    }

    return base;
  }

  private async findFamilyByIdAndTenant(
    familyId: string,
    tenantId: string | null,
  ): Promise<Family | null> {
    const queryBuilder = this.familyRepository
      .createQueryBuilder('family')
      .where('family.familyId = :familyId', { familyId });

    if (tenantId === null) {
      queryBuilder.andWhere('family.tenantId = :nil', { nil: NIL });
    } else {
      queryBuilder.andWhere('family.tenantId = :tenantId', { tenantId });
    }

    return await queryBuilder.getOne();
  }

  private async findArticleByIdAndTenant(
    articleId: string,
    tenantId: string | null,
  ): Promise<ArticleEntity | null> {
    const queryBuilder = this.articleRepository
      .createQueryBuilder('article')
      .where('article.articleId = :articleId', { articleId });

    if (tenantId === null) {
      queryBuilder.andWhere('article.tenantId = :nil', { nil: NIL });
    } else {
      queryBuilder.andWhere('article.tenantId = :tenantId', { tenantId });
    }

    return await queryBuilder.getOne();
  }

  private async findOuvrageByIdAndTenant(
    ouvrageId: string,
    tenantId: string | null,
  ): Promise<Ouvrage | null> {
    const queryBuilder = this.ouvrageRepository
      .createQueryBuilder('ouvrage')
      .where('ouvrage.ouvrageId = :ouvrageId', { ouvrageId });

    if (tenantId === null) {
      queryBuilder.andWhere('ouvrage.tenantId = :tenantId', { tenantId: NIL });
    } else {
      queryBuilder.andWhere('ouvrage.tenantId = :tenantId', { tenantId });
    }

    return await queryBuilder.getOne();
  }

  private async findFamily(
    familyId: string,
    tenantId: string,
  ): Promise<Family> {
    const [base, fallback] = await Promise.all([
      this.findFamilyByIdAndTenant(familyId, tenantId),
      this.findFamilyByIdAndTenant(familyId, null),
    ]);

    if (!base && !fallback) {
      this.logger.log(`Family from id ${familyId} not found`);
      throw new NotFoundException('Famille non trouvée');
    }

    return base || fallback!;
  }

  async saveArticle(dto: ArticleLayerDto, tenantId: string) {
    const catalog = await this.findCatalog(dto.catalogId, tenantId);

    let article = new ArticleEntity();
    if (dto.articleId) {
      const [baseArticle, fallbackArticle] = await Promise.all([
        this.findArticleByIdAndTenant(dto.articleId, tenantId),
        this.findArticleByIdAndTenant(dto.articleId, null),
      ]);

      if (!baseArticle && !fallbackArticle) {
        this.logger.log(`Article from id ${dto.articleId} not found`);
        throw new NotFoundException('Article non trouvée');
      }

      if (baseArticle) {
        article = await this.overwriteArticle(
          dto,
          baseArticle,
          fallbackArticle,
        );
      } else if (fallbackArticle) {
        article.articleNatureId = fallbackArticle.articleNatureId;
        article.catalogId = catalog.catalogId;
        article.tenantId = tenantId;
        article.articleId = fallbackArticle.articleId;
        article = await this.overwriteArticle(dto, article, fallbackArticle);
      }
    } else {
      article.tenantId = tenantId;
      article.catalogId = catalog.catalogId;
      article = await this.overwriteArticle(dto, article, null);
    }

    const saved = await this.articleRepository.save(article);

    if (dto.familyIds?.every((id) => typeof id === 'string')) {
      const familyArticles: FamilyArticle[] = [];
      for (let i = 0; i < dto.familyIds.length; i++) {
        const id = dto.familyIds[i];
        const family = await this.findFamily(id, tenantId);
        const familyArticle = new FamilyArticle();
        Object.assign(familyArticle, {
          articleId: article.articleId,
          catalogId: article.catalogId,
          familyId: family.familyId,
          articleTenantId: article.tenantId,
          familyTenantId: family.tenantId,
          family,
          isDeleted: false,
        });
        const saved = await this.familyArticleRepository.save(familyArticle);
        familyArticles.push(saved);
      }
      saved.familyArticles = familyArticles;
    }

    return saved;
  }

  async saveOuvrage(dto: OuvrageLayerDto, tenantId: string): Promise<Ouvrage> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const timeout = setTimeout(async () => {
      this.logger.warn("Timeout de transaction pour la création d'ouvrage");
      try {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
      } catch (rollbackError) {
        this.logger.error(
          `Erreur lors du rollback timeout: ${rollbackError.message}`,
        );
      }
    }, 30000);

    const catalog = await this.findCatalog(dto.catalogId, tenantId);
    let lignes: LigneOuvrage[] = [];

    let ouvrage = new Ouvrage();
    if (dto.ouvrageId) {
      const [baseOuvrage, fallbackOuvrage] = await Promise.all([
        this.findOuvrageByIdAndTenant(dto.ouvrageId, tenantId),
        this.findOuvrageByIdAndTenant(dto.ouvrageId, null),
      ]);

      if (!baseOuvrage && !fallbackOuvrage) {
        this.logger.log(`Ouvrage from id ${dto.ouvrageId} not found`);
        throw new NotFoundException('Ouvrage non trouvée');
      }

      if (baseOuvrage) {
        ouvrage = await this.overwriteOuvrage(
          dto,
          baseOuvrage,
          fallbackOuvrage,
        );
      } else if (fallbackOuvrage) {
        ouvrage.catalogId = catalog.catalogId;
        ouvrage.tenantId = tenantId;
        ouvrage.ouvrageId = fallbackOuvrage.ouvrageId;
        ouvrage = await this.overwriteOuvrage(dto, ouvrage, fallbackOuvrage);
      }
      try {
        ouvrage = await queryRunner.manager.save(ouvrage);
      } catch (error) {
        console.log('error', error);
      }

      lignes = await this.saveLigneOuvrages(
        dto.lignesOuvrage,
        ouvrage,
        fallbackOuvrage,
        tenantId,
        queryRunner,
      );
    } else {
      const _search = await this.ouvrageRepository.findOne({
        where: {
          designation: dto.designation,
          tenantId,
          catalogId: catalog.catalogId,
        },
      });

      if (_search) {
        throw new ConflictException(
          'La désignation est déjà utilisé pour un ouvrage de ce catalogue',
        );
      }

      ouvrage.tenantId = tenantId;
      ouvrage.catalogId = catalog.catalogId;
      ouvrage = await this.overwriteOuvrage(dto, ouvrage, null);
      ouvrage = await queryRunner.manager.save(ouvrage);

      lignes = await this.saveLigneOuvrages(
        dto.lignesOuvrage,
        ouvrage,
        null,
        tenantId,
        queryRunner,
      );
    }

    const familyOuvrages: FamilyOuvrage[] = [];
    if (dto.familyIds?.every((id) => typeof id === 'string')) {
      for (let i = 0; i < dto.familyIds.length; i++) {
        const id = dto.familyIds[i];
        const family = await this.findFamily(id, tenantId);
        const familyOuvrage = new FamilyOuvrage();
        Object.assign(familyOuvrage, {
          ouvrageId: ouvrage.ouvrageId,
          catalogId: ouvrage.catalogId,
          familyId: family.familyId,
          ouvrageTenantId: ouvrage.tenantId,
          familyTenantId: family.tenantId,
          family,
          isDeleted: false,
        });

        const saved = await queryRunner.manager.save(familyOuvrage);
        familyOuvrages.push(saved);
      }
    }

    try {
      const saved = await queryRunner.manager.save(ouvrage);
      saved.catalogId = catalog.catalogId;

      await queryRunner.commitTransaction();

      saved.lignesOuvrage = lignes;
      saved.familyOuvrages = familyOuvrages;
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error saving ouvrage:', error);
      throw new InternalServerErrorException(
        "Erreur lors de la sauvegarde de l'ouvrage",
      );
    } finally {
      clearTimeout(timeout);
      await queryRunner.release();
    }
  }

  private async findArticleVersions(articleId: string, tenantId: string) {
    const base = await this.articleRepository.findOne({
      where: { tenantId, articleId: articleId },
    });

    const fallback = await this.articleRepository.findOne({
      where: {
        tenantId: NIL,
        articleId: articleId,
      },
    });

    if (!base && !fallback) {
      throw new NotFoundException(`Article non trouvé`);
    }

    return { base, fallback };
  }

  async saveLigneOuvrages(
    items: LigneOuvrageLayerDto[],
    baseOuvrage: Ouvrage | null,
    fallbackOuvrage: Ouvrage | null,
    tenantId: string,
    queryRunner: QueryRunner,
  ): Promise<LigneOuvrage[]> {
    let lignes: LigneOuvrage[] = [];
    const data: LigneOuvrage[] = [];

    if (!baseOuvrage && !fallbackOuvrage) {
      this.logger.log(`Ouvrage from not found`);
      throw new NotFoundException('Ouvrage non trouvée');
    }

    if (baseOuvrage) {
      lignes = [
        ...lignes,
        ...(await this.ligneOuvrageRepository
          .createQueryBuilder('ligneOuvrage')
          .where('ligneOuvrage.ouvrageId = :ouvrageId', {
            ouvrageId: baseOuvrage.ouvrageId,
          })
          .leftJoinAndSelect(
            'ligneOuvrage.ligneOuvrageArticle',
            'ligneOuvrageArticle',
          )
          .leftJoinAndSelect('ligneOuvrage.commentaire', 'commentaire')
          .andWhere('ligneOuvrage.tenantId = :tenantId', {
            tenantId,
          })
          .getMany()),
      ];
    }

    if (fallbackOuvrage) {
      lignes = [
        ...lignes,
        ...(await this.ligneOuvrageRepository
          .createQueryBuilder('ligneOuvrage')
          .leftJoinAndSelect(
            'ligneOuvrage.ligneOuvrageArticle',
            'ligneOuvrageArticle',
          )
          .leftJoinAndSelect('ligneOuvrage.commentaire', 'commentaire')
          .where('ligneOuvrage.ouvrageId = :ouvrageId', {
            ouvrageId: fallbackOuvrage.ouvrageId,
          })
          .andWhere('ligneOuvrage.tenantId = :nil', { nil: NIL })
          .getMany()),
      ];
    }

    const groups = this.groupLigneOuvrage(lignes);
    const ligneOuvragesToAdd = items.filter((item) => !item.ligneOuvrageId);
    const ligneOuvragesToUpdate = items.filter((item) => item.ligneOuvrageId);

    for (let i = 0; i < ligneOuvragesToAdd.length; i++) {
      const dto = ligneOuvragesToAdd[i];
      let newLigne = new LigneOuvrage();
      newLigne.catalogId =
        baseOuvrage?.catalogId ?? fallbackOuvrage?.catalogId!;
      newLigne.tenantId = tenantId;
      newLigne.ouvrageId = (baseOuvrage?.ouvrageId ??
        fallbackOuvrage?.ouvrageId)!;
      newLigne.typeLigneOuvrage = dto.typeLigneOuvrage;
      newLigne = await this.overwriteLigneOuvrage(
        tenantId,
        queryRunner,
        (baseOuvrage ?? fallbackOuvrage)!,
        dto,
        newLigne,
        null,
      );

      data.push(newLigne);
    }

    for (const [ligneOuvrageId, ligneOuvrageVersions] of groups.entries()) {
      const baseLigneOuvrage =
        ligneOuvrageVersions.find((item) => item.tenantId === tenantId) || null;

      const fallbackLigneOuvrage =
        ligneOuvrageVersions.find((item) => item.tenantId == NIL) || null;

      const dto = ligneOuvragesToUpdate.find(
        (item) => item.ligneOuvrageId === ligneOuvrageId,
      );

      if (dto) {
        data.push(
          await this.overwriteLigneOuvrage(
            tenantId,
            queryRunner,
            (baseOuvrage ?? fallbackOuvrage)!,
            dto,
            baseLigneOuvrage,
            fallbackLigneOuvrage,
          ),
        );
      } else if (baseLigneOuvrage) {
        baseLigneOuvrage.isDeleted = true;
        await queryRunner.manager.save(baseLigneOuvrage);
      } else if (fallbackLigneOuvrage) {
        const newLigneOuvrage = new LigneOuvrage();
        newLigneOuvrage.tenantId = tenantId;
        newLigneOuvrage.catalogId =
          baseOuvrage?.catalogId ?? fallbackOuvrage?.catalogId!;
        newLigneOuvrage.ouvrageId = (baseOuvrage?.ouvrageId ??
          fallbackOuvrage?.ouvrageId)!;
        newLigneOuvrage.isDeleted = true;
        await queryRunner.manager.save(newLigneOuvrage);
      }
    }

    return data;
  }

  private groupLigneOuvrage(
    ligneOuvrages: LigneOuvrage[],
  ): Map<string, LigneOuvrage[]> {
    const groups = new Map<string, LigneOuvrage[]>();

    for (const ligneOuvrage of ligneOuvrages) {
      const key = ligneOuvrage.ligneOuvrageId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(ligneOuvrage);
    }

    return groups;
  }

  private async overwriteOuvrage(
    dto: OuvrageLayerDto,
    base: Ouvrage,
    fallback: Ouvrage | null,
  ): Promise<Ouvrage> {
    if (!base.ouvrageId && fallback) {
      base.designation = null;
      base.prix = null;
      base.designation = this.getPropertyValue(
        dto,
        base,
        fallback,
        'designation',
      );
      base.prix = this.getPropertyValue(dto, base, fallback, 'prix');
      return base;
    }

    base.unit = await this.overwriteUnit(dto, base, fallback);

    if (fallback) {
      base.designation = this.getPropertyValue(
        dto,
        base,
        fallback,
        'designation',
      );
      base.prix = this.getPropertyValue(dto, base, fallback, 'prix');
    } else {
      base.designation = dto.designation;
      base.prix = dto.prix;
    }

    return base;
  }

  private async overwriteLigneOuvrage(
    tenantId: string,
    queryRunner: QueryRunner,
    ouvrage: Ouvrage,
    dto: LigneOuvrageLayerDto,
    base: LigneOuvrage | null,
    fallback: LigneOuvrage | null,
  ): Promise<LigneOuvrage> {
    if (base && !base.ligneOuvrageId) {
      base.catalogId = ouvrage.catalogId;
      queryRunner.manager.save(base);
    }

    if (base && dto) {
      base.noOrdre = fallback
        ? this.getPropertyValue(dto, base, fallback, 'noOrdre')
        : dto.noOrdre;

      if (
        dto.typeLigneOuvrage === TypeLigneOuvrage.ARTICLE &&
        dto.ligneOuvrageArticle
      ) {
        const { base: baseArticle, fallback: fallbackArticle } =
          await this.findArticleVersions(
            dto.ligneOuvrageArticle.articleId,
            tenantId,
          );
        const ligneOuvrageArticle =
          base.ligneOuvrageArticle ?? new LigneOuvrageArticle();
        ligneOuvrageArticle.article = (baseArticle || fallbackArticle)!;
        ligneOuvrageArticle.ligneOuvrageId = (base?.ligneOuvrageId ||
          fallback?.ligneOuvrageId)!;

        if (fallback?.ligneOuvrageArticle && base.ligneOuvrageArticle) {
          ligneOuvrageArticle.quantite = this.getPropertyValue(
            dto.ligneOuvrageArticle,
            base?.ligneOuvrageArticle,
            fallback.ligneOuvrageArticle,
            'quantite',
          );
        } else {
          ligneOuvrageArticle.quantite = dto.ligneOuvrageArticle.quantite;
        }
        ligneOuvrageArticle.tenantId = tenantId;
        ligneOuvrageArticle.ouvrageId = ouvrage.ouvrageId;
        ligneOuvrageArticle.catalogId = ouvrage.catalogId;
        ligneOuvrageArticle.catalogArticleId = (baseArticle?.catalogId ||
          fallbackArticle?.catalogId)!;
        const ligneOuvrageArticleSaved =
          await queryRunner.manager.save(ligneOuvrageArticle);
        base.ligneOuvrageArticle = ligneOuvrageArticleSaved;
      } else if (
        dto.typeLigneOuvrage === TypeLigneOuvrage.COMMENTAIRE &&
        dto.comment
      ) {
        if (!dto.comment.description) {
          throw new BadRequestException(`Le commentaire ne peut être vide`);
        }
        const comment = base.commentaire ?? new Commentaire();
        comment.tenantId = tenantId;
        comment.description = dto.comment.description;
        const commentSaved = await queryRunner.manager.save(comment);
        base.commentaire = commentSaved;
      }

      const baseSaved = await queryRunner.manager.save(base);

      return baseSaved;
    } else if (fallback) {
      const newLigne = new LigneOuvrage();
      newLigne.catalogId = fallback.catalogId;
      newLigne.tenantId = tenantId;
      newLigne.ouvrageId = ouvrage.ouvrageId;
      newLigne.ligneOuvrageId = fallback.ligneOuvrageId;
      newLigne.typeLigneOuvrage = dto?.typeLigneOuvrage ?? null;
      newLigne.noOrdre = dto?.noOrdre ?? null;
      if (dto) {
        if (
          dto?.typeLigneOuvrage === TypeLigneOuvrage.ARTICLE &&
          dto.ligneOuvrageArticle
        ) {
          const ligneOuvrageArticle = new LigneOuvrageArticle();
          ligneOuvrageArticle.tenantId = tenantId;
          ligneOuvrageArticle.ligneOuvrageId = (base?.ligneOuvrageId ||
            fallback?.ligneOuvrageId)!;
          ligneOuvrageArticle.ouvrageId = ouvrage.ouvrageId;
          ligneOuvrageArticle.catalogId = ouvrage.catalogId;
          const { base: baseArticle, fallback: fallbackArticle } =
            await this.findArticleVersions(
              dto.ligneOuvrageArticle.articleId,
              tenantId,
            );
          ligneOuvrageArticle.article = (baseArticle || fallbackArticle)!;
          ligneOuvrageArticle.catalogArticleId = (baseArticle?.catalogId ||
            fallbackArticle?.catalogId)!;
          ligneOuvrageArticle.ligneOuvrageArticleId =
            fallback.ligneOuvrageArticle?.ligneOuvrageArticleId!;

          if (fallback?.ligneOuvrageArticle) {
            ligneOuvrageArticle.quantite = this.getPropertyValue(
              dto.ligneOuvrageArticle,
              ligneOuvrageArticle,
              fallback.ligneOuvrageArticle,
              'quantite',
            );
          } else {
            ligneOuvrageArticle.quantite = dto.ligneOuvrageArticle.quantite;
          }
          newLigne.ligneOuvrageArticle = ligneOuvrageArticle;
        } else if (
          dto.typeLigneOuvrage === TypeLigneOuvrage.COMMENTAIRE &&
          dto.comment
        ) {
          const comment = new Commentaire();
          comment.description = dto?.comment.description!;
          comment.tenantId = tenantId;
          const commentSaved = await queryRunner.manager.save(comment);
          newLigne.commentaire = commentSaved;
        }
      } else {
        newLigne.isDeleted = true;
      }

      const newLigneSaved = await queryRunner.manager.save(newLigne);

      return newLigneSaved;
    } else {
      throw new BadRequestException(`Ligne d'ouvrage non trouvée`);
    }
  }

  private async generateUniqueCode(_tenantId: string): Promise<string> {
    const prefix = 'ART-';
    const lastArticle = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.tenantId = :tenantId', { tenantId: _tenantId })
      .andWhere('article.code LIKE :pattern', { pattern: `${prefix}%` })
      .andWhere('LENGTH(article.code) = 10')
      .andWhere('article.code ~ :regex', {
        regex: `${prefix.replace('-', '\\-')}[0-9]{6}`,
      })
      .orderBy('article.code', 'DESC')
      .getOne();

    console.log('Dernier article trouvé:', lastArticle?.code);

    let counter = 1;
    if (lastArticle && lastArticle.code.startsWith(prefix)) {
      const codePart = lastArticle.code.substring(prefix.length);
      const lastNumber = parseInt(codePart);
      console.log(
        'Partie numérique extraite:',
        codePart,
        'Numéro:',
        lastNumber,
      );
      if (!isNaN(lastNumber) && lastNumber > 0) {
        counter = lastNumber + 1;
      }
    }

    console.log('Compteur calculé:', counter);

    // Générer le nouveau code avec un format à 6 chiffres
    const code = `${prefix}${counter.toString().padStart(6, '0')}`;
    console.log('Code généré:', code);

    // Vérifier que le code n'existe pas déjà (par sécurité)
    const existing = await this.articleRepository.findOne({
      where: { code: code, tenantId: _tenantId },
    });

    if (existing) {
      // Si le code existe déjà, on incrémente jusqu'à trouver un code libre
      let newCounter = counter + 1;
      while (true) {
        const newCode = `${prefix}${newCounter.toString().padStart(6, '0')}`;
        const exists = await this.articleRepository.findOne({
          where: { code: newCode, tenantId: _tenantId },
        });
        if (!exists) {
          return newCode;
        }
        newCounter++;
      }
    }

    return code;
  }
}
