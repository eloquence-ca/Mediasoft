import { Expose } from 'class-transformer';

export class LigneOuvrageArticleResponseDto {
  @Expose()
  id: string;

  @Expose()
  quantite: number | null;

  @Expose()
  articleId: string;

  @Expose()
  articleName?: string | null;
}

export class LigneOuvrageResponseDto {
  @Expose()
  id: string;

  @Expose()
  noOrdre: number | null;

  @Expose()
  typeLigneOuvrage: string | null;

  @Expose()
  commentaireId?: string;

  @Expose()
  commentaireDescription?: string | null;

  @Expose()
  articleId?: string;

  @Expose()
  articleName?: string | null;

  @Expose()
  ligneOuvrageArticle?: LigneOuvrageArticleResponseDto;

  @Expose()
  tenantId?: string;
}

export class OuvrageResponseDto {
  @Expose()
  id: string;

  @Expose()
  designation: string;

  @Expose()
  prix?: number;

  @Expose()
  tenantId?: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  catalogId?: string;

  @Expose()
  familiesCount?: number;

  @Expose()
  lignesOuvrageCount?: number;

  @Expose()
  lignesOuvrage?: LigneOuvrageResponseDto[];
}
