import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { ArticleResponseDto } from 'src/article/dto/article-response.dto';
import { ArticleEntity } from 'src/article/entities/article.entity';
import { Company } from 'src/company/entities/company.entity';
import { FamilyResponseDto } from 'src/family/dto/family-response.dto';
import { JobEntity } from 'src/job/entities/job.entity';
import { OuvrageResponseDto } from 'src/ouvrage/dto/ouvrage-response.dto';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import { In, IsNull, Repository } from 'typeorm';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';
import { CatalogEntity } from './entities/catalog.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CatalogEntity)
    private readonly catalogRepo: Repository<CatalogEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(Ouvrage)
    private readonly ouvrageRepo: Repository<Ouvrage>,
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  async create(
    dto: CreateCatalogDto,
    tenantId: string,
  ): Promise<CatalogResponseDto> {
    try {
      const exists = await this.catalogRepo.findOneBy({
        name: dto.name.trim(),
        tenantId: tenantId.trim(),
      });

      if (exists) {
        throw new ConflictException(
          `Un catalogue nommé "${dto.name}" existe déjà pour ce tenant`,
        );
      }

      let jobs: JobEntity[] = [];
      if (dto.jobs && dto.jobs.length > 0) {
        jobs = await this.jobRepo.find({ where: { id: In(dto.jobs) } });
        if (jobs.length !== dto.jobs.length) {
          const foundIds = jobs.map((j) => j.id);
          const missingIds = dto.jobs.filter((id) => !foundIds.includes(id));
          throw new NotFoundException(
            `Métiers non trouvés: ${missingIds.join(', ')}`,
          );
        }
      }

      const catalog = this.catalogRepo.create({
        name: dto.name.trim(),
        description: dto.description,
        tenantId: tenantId.trim(),
      });

      const saved = await this.catalogRepo.save(catalog);
      return this.toDto(saved);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new ConflictException('Erreur lors de la création du catalogue');
    }
  }

  async findOne(id: string): Promise<CatalogResponseDto> {
    const catalog = await this.catalogRepo
      .createQueryBuilder('catalog')
      .leftJoinAndSelect('catalog.companies', 'companies')
      .leftJoinAndSelect('catalog.jobs', 'jobs')
      .leftJoinAndSelect(
        'catalog.articles',
        'articles',
        'articles.isDeleted = false',
      )
      .leftJoinAndSelect('catalog.families', 'families')
      .leftJoinAndSelect('families.parent', 'parent')
      .leftJoinAndSelect('families.children', 'children')
      .leftJoinAndSelect('children.children', 'grandchildren')
      .leftJoinAndSelect('grandchildren.children', 'greatgrandchildren')
      .leftJoinAndSelect(
        'catalog.ouvrages',
        'ouvrages',
        'ouvrages.isDeleted = false',
      )
      .where('catalog.id = :id AND catalog.isDeleted = false', { id })
      .getOne();

    if (!catalog) {
      throw new NotFoundException('Catalogue non trouvé');
    }

    return this.toDto(catalog);
  }

  async update(id: string, dto: UpdateCatalogDto): Promise<CatalogResponseDto> {
    try {
      const catalog = await this.catalogRepo.findOne({
        where: { catalogId: id, isDeleted: false },
        relations: ['jobs'],
      });

      if (!catalog) {
        throw new NotFoundException('Catalogue non trouvé');
      }

      // Vérification de l'unicité du nom si modifié
      if (dto.name && dto.name !== catalog.name) {
        const whereCondition: any = { name: dto.name };
        if (catalog.tenantId) {
          whereCondition.tenantId = catalog.tenantId;
        } else {
          whereCondition.tenantId = IsNull();
        }

        const existing = await this.catalogRepo.findOne({
          where: whereCondition,
        });
        if (existing) {
          throw new ConflictException(
            'Un catalogue avec ce nom existe déjà pour ce tenant',
          );
        }
      }

      // Validation des jobs si fournis
      if (dto.jobs !== undefined) {
        if (dto.jobs.length > 0) {
          const jobs = await this.jobRepo.findByIds(dto.jobs);
          if (jobs.length !== dto.jobs.length) {
            const foundIds = jobs.map((j) => j.id);
            const missingIds = dto.jobs.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(
              `Jobs non trouvés: ${missingIds.join(', ')}`,
            );
          }
          // catalog.jobs = jobs;
        } else {
          // catalog.jobs = [];
        }
      }

      // Mise à jour des autres propriétés
      if (dto.name) catalog.name = dto.name.trim();
      if (dto.description !== undefined) catalog.description = dto.description;

      const saved = await this.catalogRepo.save(catalog);
      return this.toDto(saved);
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new ConflictException('Erreur lors de la mise à jour du catalogue');
    }
  }

  async remove(id: string): Promise<void> {
    const catalog = await this.catalogRepo
      .createQueryBuilder('catalog')
      .leftJoinAndSelect(
        'catalog.articles',
        'articles',
        'articles.isDeleted = false',
      )
      .leftJoinAndSelect(
        'catalog.families',
        'families',
        'families.isDeleted = false',
      )
      .leftJoinAndSelect(
        'families.children',
        'children',
        'children.isDeleted = false',
      )
      .leftJoinAndSelect(
        'children.children',
        'grandchildren',
        'grandchildren.isDeleted = false',
      )
      .leftJoinAndSelect(
        'grandchildren.children',
        'greatgrandchildren',
        'greatgrandchildren.isDeleted = false',
      )
      .leftJoinAndSelect(
        'families.articles',
        'familyArticles',
        'familyArticles.isDeleted = false',
      )
      .leftJoinAndSelect(
        'children.articles',
        'childrenArticles',
        'childrenArticles.isDeleted = false',
      )
      .leftJoinAndSelect(
        'grandchildren.articles',
        'grandchildrenArticles',
        'grandchildrenArticles.isDeleted = false',
      )
      .leftJoinAndSelect(
        'greatgrandchildren.articles',
        'greatgrandchildrenArticles',
        'greatgrandchildrenArticles.isDeleted = false',
      )
      .where('catalog.id = :id', { id })
      .andWhere('catalog.isDeleted = false')
      .getOne();

    if (!catalog) {
      throw new NotFoundException('Catalogue non trouvé');
    }

    // Marquer le catalogue comme supprimé (soft delete)
    catalog.isDeleted = true;
    await this.catalogRepo.save(catalog);

    // Collecter tous les articles à supprimer
    const allArticleIds: string[] = [];

    // Articles directs du catalogue
    if (catalog.articles && catalog.articles.length > 0) {
      allArticleIds.push(
        ...catalog.articles.map((article) => article.articleId),
      );
    }

    // Marquer tous les articles collectés comme supprimés
    if (allArticleIds.length > 0) {
      // Supprimer les doublons
      const uniqueArticleIds = [...new Set(allArticleIds)];
      await this.articleRepo.update(
        { articleId: In(uniqueArticleIds) },
        { isDeleted: true },
      );
    }
  }

  async getSubFamilies(
    catalogId: string,
    familyId: string,
  ): Promise<FamilyResponseDto[]> {
    const catalogWithFamilies = await this.catalogRepo
      .createQueryBuilder('catalog')
      .leftJoinAndSelect('catalog.families', 'family')
      .leftJoinAndSelect('family.children', 'children')
      .leftJoinAndSelect('children.children', 'grandchildren')
      .where('catalog.id = :catalogId', { catalogId })
      .getOne();

    if (!catalogWithFamilies) {
      throw new NotFoundException('Catalogue non trouvé');
    }

    const parentFamily = catalogWithFamilies.families?.find(
      (family) => family.familyId === familyId,
    );
    if (!parentFamily) {
      throw new NotFoundException('Famille non trouvée dans ce catalogue');
    }

    if (!parentFamily.children || parentFamily.children.length === 0) {
      return [];
    }

    return parentFamily.children.map((child) => {
      const familyDto = plainToClass(FamilyResponseDto, child, {
        excludeExtraneousValues: true,
      });
      familyDto.catalogId = child.catalogId;
      familyDto.tenantId = child.tenantId || undefined;
      familyDto.parentId = child.parentId || undefined;
      familyDto.childrenCount = child.children?.length || 0;
      return familyDto;
    });
  }

  private mapFamilyToDto(
    family: any,
    targetCatalogId: string,
  ): FamilyResponseDto {
    const familyDto = plainToClass(FamilyResponseDto, family, {
      excludeExtraneousValues: true,
    });
    familyDto.catalogId = family.catalogId;
    familyDto.tenantId = family.tenant?.id;
    familyDto.parentId = family.parent?.id;

    // IMPORTANT: Filtrer les enfants par catalogId avant de les compter
    const filteredChildren =
      family.children?.filter((child) => child.catalogId === targetCatalogId) ||
      [];
    familyDto.childrenCount = filteredChildren.length;

    // Récursivement mapper les enfants filtrés
    if (filteredChildren.length > 0) {
      familyDto.children = filteredChildren.map((child) =>
        this.mapFamilyToDto(child, targetCatalogId),
      );
    } else {
      familyDto.children = [];
    }

    return familyDto;
  }

  private toDto(entity: CatalogEntity): CatalogResponseDto {
    const dto = plainToClass(CatalogResponseDto, entity, {
      excludeExtraneousValues: true,
    });

    dto.companiesCount = 0;
    dto.jobsCount = 0;
    dto.articlesCount = entity.articles?.length || 0;
    dto.ouvragesCount = entity.ouvrages?.length || 0;

    if (entity.articles) {
      dto.articles = entity.articles.map((article) =>
        plainToClass(ArticleResponseDto, article, {
          excludeExtraneousValues: true,
        }),
      );
    }

    if (entity.families) {
      const topLevelFamilies = entity.families.filter(
        (family) => !family.parent && family.catalogId === entity.catalogId,
      );

      dto.families = topLevelFamilies.map((family) => {
        const familyDto = plainToClass(FamilyResponseDto, family, {
          excludeExtraneousValues: true,
        });
        familyDto.catalogId = family.catalogId;
        familyDto.tenantId = family.tenantId;
        familyDto.parentId = family.parent?.familyId;

        // Filtrer et compter les enfants par catalogId
        const filteredChildren =
          family.children?.filter(
            (child) => child.catalogId === entity.catalogId,
          ) || [];
        familyDto.childrenCount = filteredChildren.length;

        // Inclure les enfants dans la réponse (en filtrant aussi par catalogId)
        if (filteredChildren.length > 0) {
          familyDto.children = filteredChildren.map((child) =>
            this.mapFamilyToDto(child, entity.catalogId),
          );
        } else {
          familyDto.children = [];
        }

        return familyDto;
      });

      // Mettre à jour le compteur pour ne compter que les familles de premier niveau de ce catalogue
      dto.familiesCount = topLevelFamilies.length;
    } else {
      dto.families = [];
      dto.familiesCount = 0;
    }

    if (entity.ouvrages) {
      dto.ouvrages = entity.ouvrages.map((ouvrage) =>
        plainToClass(OuvrageResponseDto, ouvrage, {
          excludeExtraneousValues: true,
        }),
      );
    }

    return dto;
  }

  async getArticlesByCatalog(catalogId: string): Promise<any> {
    const catalog = await this.catalogRepo.findOne({
      where: { catalogId: catalogId, isDeleted: false },
    });

    if (!catalog) {
      throw new NotFoundException('Catalogue non trouvé');
    }

    // Récupérer tous les articles qui appartiennent à ce catalogue
    const articles = await this.articleRepo
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.families', 'families')
      .leftJoinAndSelect('article.saleUnit', 'saleUnit')
      .leftJoinAndSelect('article.purchaseUnit', 'purchaseUnit')
      .leftJoinAndSelect('article.articleNature', 'articleNature')
      .where('article.catalogId = :catalogId', { catalogId: catalog.catalogId })
      .andWhere('article.isDeleted = false')
      .getMany();

    return articles.map((article) => ({
      id: article.articleId,
      articleId: article.articleId,
      code: article.code,
      name: article.name,
      label: article.label,
      commercialDescription: article.commercialDescription,
      photo: article.photo,
      lastPurchasePriceUpdateDate: article.lastPurchasePriceUpdateDate,
      lastSellingPriceUpdateDate: article.lastSellingPriceUpdateDate,
      purchasePrice: article.purchasePrice,
      margin: article.margin,
      sellingPrice: article.sellingPrice,
      conversionCoefficient: article.conversionCoefficient,
      isDeleted: article.isDeleted,
      catalogId: article.catalogId,
      tenantId: article.tenantId,
      families: [],
      saleUnit: article.saleUnit,
      purchaseUnit: article.purchaseUnit,
      articleNature: article.articleNature,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
    }));
  }

  async getOuvragesByCatalog(catalogId: string): Promise<any> {
    // Vérifier que le catalogue existe
    const catalog = await this.catalogRepo.findOne({
      where: { catalogId: catalogId, isDeleted: false },
    });

    if (!catalog) {
      throw new NotFoundException('Catalogue non trouvé');
    }

    // Récupérer tous les ouvrages qui appartiennent à ce catalogue
    const ouvrages = await this.ouvrageRepo
      .createQueryBuilder('ouvrage')
      .leftJoinAndSelect('ouvrage.families', 'families')
      .leftJoinAndSelect(
        'ouvrage.lignesOuvrage',
        'lignesOuvrage',
        'lignesOuvrage.isDeleted = false',
      )
      .leftJoinAndSelect(
        'lignesOuvrage.ligneOuvrageArticle',
        'ligneOuvrageArticle',
      )
      .leftJoinAndSelect('ligneOuvrageArticle.article', 'article')
      .leftJoinAndSelect('ouvrage.tenant', 'tenant')
      .where('ouvrage.catalogId = :catalogId', { catalogId: catalog.catalogId })
      .andWhere('ouvrage.isDeleted = false')
      .getMany();

    return ouvrages.map((ouvrage) => ({
      id: ouvrage.ouvrageId,
      ouvrageId: ouvrage.ouvrageId,
      designation: ouvrage.designation,
      prix: ouvrage.prix,
      catalogId: ouvrage.catalogId,
      tenantId: ouvrage.tenantId,
      families: [],
      lignesOuvrage: ouvrage.lignesOuvrage || [],
      createdAt: ouvrage.createdAt,
      updatedAt: ouvrage.updatedAt,
    }));
  }

  async assignCompaniesToCatalog(
    catalogId: string,
    companyIds: string[],
  ): Promise<void> {
    try {
      // Vérifier que le catalogue existe
      const catalog = await this.catalogRepo.findOne({
        where: { catalogId: catalogId, isDeleted: false },
        relations: ['companies'],
      });

      if (!catalog) {
        throw new NotFoundException('Catalogue non trouvé');
      }

      // Vérifier que toutes les sociétés existent
      const companies = await this.companyRepo.findByIds(companyIds);
      if (companies.length !== companyIds.length) {
        const foundIds = companies.map((c) => c.id);
        const missingIds = companyIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Sociétés non trouvées: ${missingIds.join(', ')}`,
        );
      }

      await this.catalogRepo.save(catalog);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(
        "Erreur lors de l'affectation des sociétés au catalogue",
      );
    }
  }

  async removeCompaniesFromCatalog(
    catalogId: string,
    companyIds: string[],
  ): Promise<void> {
    try {
      // Vérifier que le catalogue existe
      const catalog = await this.catalogRepo.findOne({
        where: { catalogId: catalogId, isDeleted: false },
        relations: ['companies'],
      });

      if (!catalog) {
        throw new NotFoundException('Catalogue non trouvé');
      }

      // Vérifier que toutes les sociétés existent
      const companies = await this.companyRepo.findByIds(companyIds);
      if (companies.length !== companyIds.length) {
        const foundIds = companies.map((c) => c.id);
        const missingIds = companyIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Sociétés non trouvées: ${missingIds.join(', ')}`,
        );
      }

      await this.catalogRepo.save(catalog);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new ConflictException(
        'Erreur lors de la suppression des sociétés du catalogue',
      );
    }
  }

  async getCatalogCompanies(catalogId: string): Promise<any> {
    try {
      // Vérifier que le catalogue existe et récupérer ses sociétés
      const catalog = await this.catalogRepo.findOne({
        where: { catalogId: catalogId, isDeleted: false },
        relations: ['companies'],
      });

      if (!catalog) {
        throw new NotFoundException('Catalogue non trouvé');
      }

      return [];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ConflictException(
        'Erreur lors de la récupération des sociétés du catalogue',
      );
    }
  }
}
