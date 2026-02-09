import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleNature } from 'src/article-nature/entities/article-nature.entity';
import { Commentaire } from 'src/commentaire/entities/commentaire.entity';
import { NIL } from 'src/common/constants';
import { LigneOuvrageArticle } from 'src/ligne-ouvrage/entities/ligne-ouvrage-article.entity';
import {
  LigneOuvrage,
  TypeLigneOuvrage,
} from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';
import { UnitEntity } from 'src/unit/entities/unit.entity';
import { In, Repository } from 'typeorm';
import { ArticleEntity } from '../article/entities/article.entity';
import { Family } from '../family/entities/family.entity';
import { Ouvrage } from '../ouvrage/entities/ouvrage.entity';
import { CatalogEntity } from './entities/catalog.entity';

export class MergedCatalog {
  catalogId: string;
  dynamic?: boolean;
  name: string | null;
  description: string;
  tenantId: string | null;
  isDeleted: boolean | null;
  families?: MergedFamily[];
  createdAt: Date;
  updatedAt: Date;
}

export class MergedFamily {
  familyId: string;
  name: string | null;
  catalogId: string;
  tenantId: string | null;
  parentId: string | null;
  isDeleted: boolean | null;
  children?: MergedFamily[];
  articles?: MergedArticle[];
  ouvrages?: MergedOuvrage[];
  createdAt: Date;
  updatedAt: Date;
}

export class MergedArticle {
  articleId: string;
  saleUnitId?: string | null;
  purchaseUnitId?: string | null;
  articleNatureId?: string | null;
  code: string;
  name: string | null;
  label: string | null;
  isDeleted: boolean | null;
  commercialDescription: string | null;
  photo: string | null;
  purchasePrice: number | null;
  margin: number | null;
  sellingPrice: number | null;
  _purchasePrice?: number | null;
  _margin?: number | null;
  _sellingPrice?: number | null;
  saleUnit: UnitEntity | null;
  purchaseUnit: UnitEntity | null;
  articleNature: ArticleNature | null;
  conversionCoefficient: number | null;
  catalogId: string | null;
  tenantId: string | null;
  families?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class MergedOuvrage {
  ouvrageId: string;
  unitId?: string | null;
  designation?: string | null;
  isDeleted: boolean | null;
  prix?: number | null;
  catalogId: string;
  tenantId: string | null;
  unit?: UnitEntity | null;
  families?: string[];
  ligneOuvrages: MergedLigneOuvrage[];
  createdAt: Date;
  updatedAt: Date;
}

export class MergedLigneOuvrage {
  ouvrageId: string;
  ligneOuvrageId: string;
  tenantId: string | null;
  isDeleted: boolean | null;
  commentaireId?: string | null;
  commentaire?: Commentaire | null;
  noOrdre: number | null;
  typeLigneOuvrage: TypeLigneOuvrage | null;
  ligneOuvrageArticle?: MergedLigneOuvrageArticle | null;
  createdAt: Date;
  updatedAt: Date;
}

export class MergedLigneOuvrageArticle {
  ouvrageId: string;
  ligneOuvrageArticleId: string;
  ligneOuvrageId: string;
  isDeleted: boolean | null;
  catalogArticleId: string;
  catalogOuvrageId: string;
  quantite: number | null;
  tenantId: string | null;
  articleId: string;
  article: MergedArticle;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CatalogMergeService {
  constructor(
    @InjectRepository(CatalogEntity)
    private readonly catalogRepository: Repository<CatalogEntity>,
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(Ouvrage)
    private readonly ouvrageRepository: Repository<Ouvrage>,
    @InjectRepository(LigneOuvrage)
    private readonly ligneOuvrageRepository: Repository<LigneOuvrage>,
    @InjectRepository(LigneOuvrageArticle)
    private readonly ligneOuvrageArticleRepository: Repository<LigneOuvrageArticle>,
  ) {}

  /**
   * Récupère les catalogues d'un tenant avec les familles parent et merge des données
   */
  async getCatalogsWithFamilies(tenantId: string): Promise<MergedCatalog[]> {
    const catalogs = await this.catalogRepository.find({
      where: { tenantId: In([tenantId, NIL]) },
    });

    const catalogGroups = this.groupByCatalogId(catalogs);
    const mergedCatalogs: MergedCatalog[] = [];

    for (const [catalogId, catalogVersions] of catalogGroups.entries()) {
      const mergedCatalog = this.mergeCatalogVersions(
        catalogVersions,
        tenantId,
      );

      if (mergedCatalog.tenantId != NIL) {
        const parentFamilies = await this.getParentFamiliesForCatalog(
          catalogId,
          tenantId,
        );
        mergedCatalog.families = parentFamilies;

        mergedCatalogs.push(mergedCatalog);
      }
    }

    return this.filterNotDeleted(mergedCatalogs).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  /**
   * Récupère un catalogue avec merge des données
   */
  async getCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<MergedCatalog> {
    const catalogs = await this.catalogRepository.find({
      where: { tenantId: In([tenantId, NIL]), catalogId: catalogId },
    });

    if (!catalogs.length) {
      throw new NotFoundException(`Catalogue non trouvée`);
    }

    const mergedCatalog = this.mergeCatalogVersions(catalogs, tenantId);

    return mergedCatalog;
  }

  /**
   * Récupère une famille avec merge des données
   */
  async getFamily(familyId: string, tenantId: string): Promise<MergedFamily> {
    const families = await this.familyRepository.find({
      where: { tenantId: In([tenantId, NIL]), familyId: familyId },
    });

    if (!families.length) {
      throw new NotFoundException(`Famille non trouvée`);
    }

    const catalog = await this.getCatalogsById(families[0].catalogId);

    return this.mergeFamilyVersions(families, tenantId, catalog.catalogId);
  }

  /**
   * Récupère un aticle avec merge des données
   */
  async getArticle(
    articleId: string,
    tenantId: string,
  ): Promise<MergedArticle> {
    const articles = await this.articleRepository.find({
      where: { tenantId: In([tenantId, NIL]), articleId: articleId },
      relations: {
        saleUnit: true,
        purchaseUnit: true,
        articleNature: true,
        familyArticles: true,
      },
    });

    if (!articles.length) {
      throw new NotFoundException(`Article non trouvée`);
    }

    const catalog = await this.getCatalogsById(articles[0].catalogId);
    return this.mergeArticleVersions(articles, tenantId, catalog.catalogId);
  }

  /**
   * Récupère un ouvrage avec merge des données
   */
  async getOuvrage(
    ouvrageId: string,
    tenantId: string,
  ): Promise<MergedOuvrage> {
    const ouvrages = await this.ouvrageRepository.find({
      where: { tenantId: In([tenantId, NIL]), ouvrageId: ouvrageId },
      relations: {
        familyOuvrages: true,
        unit: true,
      },
    });

    if (!ouvrages.length) {
      throw new NotFoundException(`Ouvrage non trouvée`);
    }

    const ouvrage = this.mergeOuvrageVersions(
      ouvrages,
      tenantId,
      ouvrages[0].catalogId,
    );

    ouvrage.ligneOuvrages = await this.getLigneOuvrages(
      ouvrageId,
      ouvrages[0].catalogId,
      tenantId,
    );

    return ouvrage;
  }

  /**
   * Récupère les sous-familles d'une famille avec merge
   */
  async getSubFamilies(
    familyId: string,
    tenantId: string,
  ): Promise<MergedFamily[]> {
    const parentFamilies = await this.familyRepository.find({
      where: { tenantId: In([tenantId, NIL]), familyId },
    });

    if (parentFamilies.length === 0) {
      throw new NotFoundException('Famille non trouvée');
    }

    const { base, fallback } = this.getFamilyVersions(parentFamilies, tenantId);

    const catalog = await this.getCatalogsById(
      base.catalogId || fallback.catalogId,
    );

    const families = await this.familyRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        parentTenantId: In([tenantId, NIL]),
        parentId: familyId,
      },
    });

    const childFamilyGroups = this.groupByFamilyId(families);

    const children: MergedFamily[] = [];
    for (const [childFamilyId, childVersions] of childFamilyGroups.entries()) {
      const mergedChild = this.mergeFamilyVersions(
        childVersions,
        tenantId,
        catalog.catalogId,
      );
      children.push(mergedChild);
    }

    return this.filterNotDeleted(children).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  private async getCatalogsById(catalogId: string): Promise<CatalogEntity> {
    const catalog = await this.catalogRepository.findOne({
      where: { catalogId },
    });

    if (!catalog) {
      throw new NotFoundException(`Catalogue non trouvé`);
    }

    return catalog;
  }

  /**
   * Récupère les articles d'un catalogue avec merge
   */
  async getArticlesForCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<MergedArticle[]> {
    await this.getCatalog(catalogId, tenantId);

    const articles = await this.articleRepository.find({
      where: { tenantId: In([tenantId, NIL]), catalogId },
      relations: {
        saleUnit: true,
        purchaseUnit: true,
        articleNature: true,
        familyArticles: true,
      },
    });

    // Grouper et merger les articles
    const articleGroups = this.groupByArticleId(articles);
    const mergedArticles: MergedArticle[] = [];

    for (const [articleId, articleVersions] of articleGroups.entries()) {
      const merged = this.mergeArticleVersions(
        articleVersions,
        tenantId,
        catalogId,
      );
      mergedArticles.push(merged);
    }

    return this.filterNotDeleted(mergedArticles).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  /**
   * Récupère les articles
   */
  async getArticles(tenantId: string): Promise<MergedArticle[]> {
    const catalogs = await this.getCatalogsWithFamilies(tenantId);
    let articles: MergedArticle[] = [];

    for (const catalog of catalogs) {
      articles = [
        ...articles,
        ...(await this.getArticlesForCatalog(catalog.catalogId, tenantId)),
      ];
    }
    return this.filterNotDeleted(articles).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  /**
   * Récupère les articles d'une famille avec merge
   */
  async getArticlesForFamily(
    familyId: string,
    tenantId: string,
  ): Promise<MergedArticle[]> {
    const familyVersions = await this.familyRepository.find({
      where: { tenantId: In([tenantId, NIL]), familyId },
    });

    const { base, fallback } = this.getFamilyVersions(familyVersions, tenantId);

    const catalog = await this.getCatalogsById(
      base.catalogId || fallback.catalogId,
    );

    const linkedArticles = await this.articleRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        familyArticles: { familyId },
      },
      relations: {
        saleUnit: true,
        purchaseUnit: true,
        articleNature: true,
        familyArticles: true,
      },
    });

    const articleIds = [...new Set(linkedArticles.map((a) => a.articleId))];

    const allVersions = await this.articleRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        articleId: In(articleIds),
      },
      relations: {
        saleUnit: true,
        purchaseUnit: true,
        articleNature: true,
        familyArticles: true,
      },
    });

    const articleGroups = this.groupByArticleId(allVersions);
    const mergedArticles: MergedArticle[] = [];

    for (const [articleId, articleVersions] of articleGroups.entries()) {
      const merged = this.mergeArticleVersions(
        articleVersions,
        tenantId,
        catalog.catalogId,
      );
      mergedArticles.push(merged);
    }

    return this.filterNotDeleted(mergedArticles).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  /**
   * Récupère les ouvrages d'un catalogue avec merge
   */
  async getOuvragesForCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<MergedOuvrage[]> {
    await this.getCatalog(catalogId, tenantId);

    const ouvrages = await this.ouvrageRepository.find({
      where: { tenantId: In([tenantId, NIL]), catalogId },
      relations: { unit: true, familyOuvrages: true },
    });

    const ouvrageGroups = this.groupByOuvrageId(ouvrages);
    const mergedOuvrages: MergedOuvrage[] = [];

    for (const [ouvrageId, ouvrageVersions] of ouvrageGroups.entries()) {
      const merged = this.mergeOuvrageVersions(
        ouvrageVersions,
        tenantId,
        catalogId,
      );

      merged.ligneOuvrages = await this.getLigneOuvrages(
        ouvrageId,
        catalogId,
        tenantId,
      );

      mergedOuvrages.push(merged);
    }

    return this.filterNotDeleted(mergedOuvrages).sort((a, b) =>
      (a.designation || '').localeCompare(b.designation || ''),
    );
  }

  /**
   * Récupère les ouvrages d'une famille avec merge
   */
  async getOuvragesForFamily(
    familyId: string,
    tenantId: string,
  ): Promise<MergedOuvrage[]> {
    const familyVersions = await this.familyRepository.find({
      where: { tenantId: In([tenantId, NIL]), familyId },
    });

    const { base, fallback } = this.getFamilyVersions(familyVersions, tenantId);

    const catalog = await this.getCatalogsById(
      base.catalogId || fallback.catalogId,
    );

    const linkedOuvrages = await this.ouvrageRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        familyOuvrages: { familyId },
      },
      relations: {
        unit: true,
        familyOuvrages: true,
      },
    });

    const ouvrageIds = [...new Set(linkedOuvrages.map((o) => o.ouvrageId))];

    const allVersions = await this.ouvrageRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        ouvrageId: In(ouvrageIds),
      },
      relations: {
        unit: true,
        familyOuvrages: true,
      },
    });

    const ouvrageGroups = this.groupByOuvrageId(allVersions);
    const mergedOuvrages: MergedOuvrage[] = [];

    for (const [ouvrageId, ouvrageVersions] of ouvrageGroups.entries()) {
      const merged = this.mergeOuvrageVersions(
        ouvrageVersions,
        tenantId,
        catalog.catalogId,
      );

      merged.ligneOuvrages = await this.getLigneOuvrages(
        ouvrageId,
        catalog.catalogId,
        tenantId,
      );

      mergedOuvrages.push(merged);
    }

    return this.filterNotDeleted(mergedOuvrages).sort((a, b) =>
      (a.designation || '').localeCompare(b.designation || ''),
    );
  }

  /**
   * Récupère les lignes ouvrages d'un ouvrage avec merge
   */
  async getLigneOuvrages(
    ouvrageId: string,
    catalogId: string,
    tenantId: string,
  ): Promise<MergedLigneOuvrage[]> {
    const ligneOuvrages = await this.ligneOuvrageRepository.find({
      where: { tenantId: In([tenantId, NIL]), ouvrageId },
      relations: {
        ligneOuvrageArticle: { article: true },
        commentaire: true,
      },
    });

    const ligneOuvrageGroups = this.groupByLigneOuvrage(ligneOuvrages);
    const mergedLigneOuvrages: MergedLigneOuvrage[] = [];

    for (const [
      ligneOuvrageId,
      ligneOuvrageVersions,
    ] of ligneOuvrageGroups.entries()) {
      const merged = await this.mergeLigneOuvrageVersions(
        ligneOuvrageVersions,
        tenantId,
        catalogId,
      );
      mergedLigneOuvrages.push(merged);
    }

    return this.filterNotDeleted(mergedLigneOuvrages);
  }

  private groupByCatalogId(
    catalogs: CatalogEntity[],
  ): Map<string, CatalogEntity[]> {
    const groups = new Map<string, CatalogEntity[]>();

    for (const catalog of catalogs) {
      const key = catalog.catalogId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(catalog);
    }

    return groups;
  }

  private groupByFamilyId(families: Family[]): Map<string, Family[]> {
    const groups = new Map<string, Family[]>();

    for (const family of families) {
      const key = family.familyId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(family);
    }

    return groups;
  }

  private groupByArticleId(
    articles: ArticleEntity[],
  ): Map<string, ArticleEntity[]> {
    const groups = new Map<string, ArticleEntity[]>();

    for (const article of articles) {
      const key = article.articleId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(article);
    }

    return groups;
  }

  private groupByOuvrageId(ouvrages: Ouvrage[]): Map<string, Ouvrage[]> {
    const groups = new Map<string, Ouvrage[]>();

    for (const ouvrage of ouvrages) {
      const key = ouvrage.ouvrageId;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(ouvrage);
    }

    return groups;
  }

  private groupByLigneOuvrage(
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

  private getCatalogVersions(versions: CatalogEntity[], tenantId: string) {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    return { base, fallback };
  }

  private mergeCatalogVersions(
    versions: CatalogEntity[],
    tenantId: string,
  ): MergedCatalog {
    const { base, fallback } = this.getCatalogVersions(versions, tenantId);
    return {
      catalogId: base?.catalogId || fallback?.catalogId,
      dynamic: fallback?.tenantId === NIL || base?.tenantId === NIL,
      name: base?.name || fallback?.name,
      description: base?.description || fallback?.description,
      tenantId: base.tenantId,
      isDeleted:
        base.isDeleted === null
          ? false
          : (base.isDeleted ?? fallback.isDeleted),
      createdAt: base?.createdAt || fallback?.createdAt,
      updatedAt: base?.updatedAt || fallback?.updatedAt,
    };
  }

  private getFamilyVersions(versions: Family[], tenantId: string) {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    return { base, fallback };
  }

  private getOuvrageVersions(versions: Ouvrage[], tenantId: string) {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    return { base, fallback };
  }

  private mergeFamilyVersions(
    versions: Family[],
    tenantId: string,
    catalogId: string,
  ): MergedFamily {
    const { base, fallback } = this.getFamilyVersions(versions, tenantId);

    return {
      familyId: base.familyId,
      name: base.name ?? fallback.name,
      isDeleted:
        base.isDeleted === null
          ? false
          : (base.isDeleted ?? fallback.isDeleted),
      catalogId,
      tenantId: base.tenantId,
      parentId: base.parentId ?? fallback.parentId,
      createdAt: base.createdAt ?? fallback.createdAt,
      updatedAt: base.updatedAt ?? fallback.updatedAt,
    };
  }

  private mergeArticleVersions(
    versions: ArticleEntity[],
    tenantId: string,
    catalogId: string,
  ): MergedArticle {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    let families: string[] = [];

    if (base) {
      families = [
        ...families,
        ...base.familyArticles.map((item) => item.familyId),
      ];
    } else if (fallback) {
      families = [
        ...families,
        ...fallback.familyArticles.map((item) => item.familyId),
      ];
    }

    families = [...new Set(families)];

    return {
      articleId: base.articleId,
      code: base.code ?? fallback.code,
      name: base.name ?? fallback.name,
      label: base.label ?? fallback.label,
      isDeleted:
        base.isDeleted === null
          ? false
          : (base.isDeleted ?? fallback.isDeleted),
      commercialDescription:
        base.commercialDescription ?? fallback.commercialDescription,
      photo: base.photo ?? fallback.photo,
      purchasePrice: base.purchasePrice ?? fallback.purchasePrice,
      margin: base.margin ?? fallback.margin,
      _purchasePrice:
        base.tenantId != NIL && base.purchasePrice && fallback.tenantId === NIL
          ? fallback.purchasePrice
          : null,
      _margin:
        base.tenantId != NIL && base.margin && fallback.tenantId === NIL
          ? fallback.margin
          : null,
      _sellingPrice:
        base.tenantId != NIL && base.sellingPrice && fallback.tenantId === NIL
          ? fallback.sellingPrice
          : null,
      sellingPrice: base.sellingPrice ?? fallback.sellingPrice,
      purchaseUnit: base.purchaseUnit ?? fallback.purchaseUnit,
      saleUnit: base.saleUnit ?? fallback.saleUnit,
      articleNature: base.articleNature ?? fallback.articleNature,
      purchaseUnitId: base.purchaseUnit?.id ?? fallback.purchaseUnit?.id,
      saleUnitId: base.saleUnit?.id ?? fallback.saleUnit?.id,
      articleNatureId: base.articleNature?.id ?? fallback.articleNature?.id,
      conversionCoefficient:
        base.conversionCoefficient ?? fallback.conversionCoefficient,
      catalogId,
      tenantId: base.tenantId,
      families: families,
      createdAt: base.createdAt ?? fallback.createdAt,
      updatedAt: base.updatedAt ?? fallback.updatedAt,
    };
  }

  private mergeOuvrageVersions(
    versions: Ouvrage[],
    tenantId: string,
    catalogId: string,
  ): MergedOuvrage {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    let families: string[] = [];

    if (base.familyOuvrages) {
      families = [
        ...families,
        ...base.familyOuvrages.map((item) => item.familyId),
      ];
    }

    if (fallback.familyOuvrages) {
      families = [
        ...families,
        ...fallback.familyOuvrages.map((item) => item.familyId),
      ];
    }

    return {
      catalogId,
      ouvrageId: base.ouvrageId,
      designation: base.designation ?? fallback.designation,
      prix: base.prix ?? fallback.prix,
      isDeleted:
        base.isDeleted === null
          ? false
          : (base.isDeleted ?? fallback.isDeleted),
      ligneOuvrages: [],
      tenantId: base.tenantId,
      families: families,
      unit: base.unit ?? fallback.unit,
      unitId: base.unitId ?? fallback.unitId,
      createdAt: base.createdAt ?? fallback.createdAt,
      updatedAt: base.updatedAt ?? fallback.updatedAt,
    };
  }

  private async mergeLigneOuvrageVersions(
    versions: LigneOuvrage[],
    tenantId: string,
    catalogId: string,
  ): Promise<MergedLigneOuvrage> {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    const ligneOuvrageArticles: LigneOuvrageArticle[] = [];

    if (base.ligneOuvrageArticle?.article) {
      ligneOuvrageArticles.push(base.ligneOuvrageArticle);
    }

    if (fallback.ligneOuvrageArticle?.article) {
      ligneOuvrageArticles.push(fallback.ligneOuvrageArticle);
    }

    return {
      tenantId: base.tenantId,
      ouvrageId: base.ouvrageId,
      ligneOuvrageId: base.ligneOuvrageId,
      isDeleted:
        base.isDeleted === null
          ? false
          : (base.isDeleted ?? fallback.isDeleted),
      commentaireId: base.commentaireId || fallback.commentaireId,
      commentaire: base.commentaire || fallback.commentaire,
      noOrdre: base.noOrdre || fallback.noOrdre,
      typeLigneOuvrage: base.typeLigneOuvrage || fallback.typeLigneOuvrage,
      ligneOuvrageArticle:
        ligneOuvrageArticles.length > 0
          ? await this.mergeLigneOuvrageArticleVersions(
              ligneOuvrageArticles,
              tenantId,
              catalogId,
            )
          : null,
      createdAt: base.createdAt ?? fallback.createdAt,
      updatedAt: base.updatedAt ?? fallback.updatedAt,
    };
  }

  private async mergeLigneOuvrageArticleVersions(
    versions: LigneOuvrageArticle[],
    tenantId: string,
    catalogId: string,
  ): Promise<MergedLigneOuvrageArticle> {
    const tenantVersion = versions.find((v) => v.tenantId === tenantId);
    const sourceVersion = versions.find((v) => v.tenantId === NIL);

    const base = tenantVersion || sourceVersion!;
    const fallback = sourceVersion || tenantVersion!;

    return {
      ouvrageId: base.ouvrageId ?? fallback.ouvrageId,
      ligneOuvrageArticleId:
        base.ligneOuvrageArticleId ?? fallback.ligneOuvrageArticleId,
      ligneOuvrageId: base.ligneOuvrageId ?? fallback.ligneOuvrageId,
      catalogArticleId: base.catalogArticleId ?? fallback.catalogArticleId,
      catalogOuvrageId: base.catalogId ?? fallback.catalogId,
      isDeleted:
        base.isDeleted === null
          ? false
          : (base.isDeleted ?? fallback.isDeleted),
      quantite: base.quantite ?? fallback.quantite,
      articleId: base.article.articleId ?? fallback.article.articleId,
      article: await this.getArticle(
        base.article.articleId || fallback.article.articleId,
        tenantId,
      ),
      tenantId: base.tenantId,
      createdAt: base.createdAt ?? fallback.createdAt,
      updatedAt: base.updatedAt ?? fallback.updatedAt,
    };
  }

  async getParentFamiliesForCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<MergedFamily[]> {
    const families = await this.familyRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        catalogId,
      },
    });

    const parentFamilies = families.filter((f) => f.parentId === null);
    const familyGroups = this.groupByFamilyId(parentFamilies);

    const mergedFamilies: MergedFamily[] = [];
    for (const [familyId, familyVersions] of familyGroups.entries()) {
      const merged = this.mergeFamilyVersions(
        familyVersions,
        tenantId,
        catalogId,
      );
      mergedFamilies.push(merged);
    }

    return this.filterNotDeleted(mergedFamilies).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  async getAllFamiliesForCatalog(
    catalogId: string,
    tenantId: string,
  ): Promise<MergedFamily[]> {
    const families = await this.familyRepository.find({
      where: {
        tenantId: In([tenantId, NIL]),
        catalogId,
      },
    });

    const familyGroups = this.groupByFamilyId(families);

    const mergedFamilies: MergedFamily[] = [];
    for (const [familyId, familyVersions] of familyGroups.entries()) {
      const merged = this.mergeFamilyVersions(
        familyVersions,
        tenantId,
        catalogId,
      );
      mergedFamilies.push(merged);
    }

    return this.filterNotDeleted(mergedFamilies).sort((a, b) =>
      (a.name || '').localeCompare(b.name || ''),
    );
  }

  private filterNotDeleted<T extends { isDeleted: boolean | null }>(
    items: T[],
  ): T[] {
    return items.filter((item) => !item.isDeleted);
  }
}
