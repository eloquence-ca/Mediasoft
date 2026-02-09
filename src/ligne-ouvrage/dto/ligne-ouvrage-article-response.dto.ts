import { Expose } from 'class-transformer';

export class LigneOuvrageArticleResponseDto {
  @Expose()
  id: string;

  @Expose()
  quantite: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  ligneOuvrageId?: string;

  @Expose()
  articleId?: string;
}