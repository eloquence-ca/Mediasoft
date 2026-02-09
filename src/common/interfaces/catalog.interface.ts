import { CatalogEntity } from 'src/catalog/entities/catalog.entity';
import { TypeLigneOuvrage } from 'src/ligne-ouvrage/entities/ligne-ouvrage.entity';

export interface CatalogInterface {
  id: string;
  name: string;
  description: string;
  isDeleted: boolean;
  families: FamilyInterface[];
  articles: ArticleInterface[];
  ouvrages: OuvrageInterface[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyInterface {
  id: string;
  name: string;
  isDeleted: boolean;
  catalogId: string;
  tenantId: string;
  parentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ArticleInterface {
  id: string;
  catalogId: string;
  saleUnitId?: string;
  purchaseUnitId?: string;
  articleNatureId?: string;
  familiesIds: string[];
  code: string;
  name: string;
  label: string;
  commercialDescription: string;
  photo: string;
  lastPurchasePriceUpdateDate: Date;
  lastSellingPriceUpdateDate: Date;
  purchasePrice: number;
  margin: number;
  sellingPrice: number;
  conversionCoefficient: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OuvrageInterface {
  id: string;
  catalogId: CatalogEntity;
  unitId?: string;
  familiesIds: string[];
  designation: string;
  isDeleted: boolean;
  prix?: number;
  lignesOuvrage: LigneOuvrageInterface[];
  createdAt: Date;
  updatedAt: Date;
}

export class LigneOuvrageInterface {
  id: string;
  ouvrageId: string;
  commentaireId?: string;
  noOrdre: number;
  isDeleted: boolean;
  typeLigneOuvrage: TypeLigneOuvrage;
  commentaire?: CommentaireInterface;
  ligneOuvrageArticle?: LigneOuvrageArticleInterface;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentaireInterface {
  id: string;
  description: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class LigneOuvrageArticleInterface {
  id: string;
  ligneOuvrageId: string;
  articleId: string;
  isDeleted: boolean;
  quantite: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CatalogTenantUpsert {
  tenantId: string;
  catalogId: string;
}
