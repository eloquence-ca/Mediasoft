import { Expose } from 'class-transformer';
import { TypeLigneOuvrage } from '../entities/ligne-ouvrage.entity';

export class LigneOuvrageResponseDto {
  @Expose()
  id: string;

  @Expose()
  noOrdre: number;

  @Expose()
  typeLigneOuvrage: TypeLigneOuvrage;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  ouvrageId?: string;

  @Expose()
  commentaireId?: string;

  @Expose()
  commentaireDescription?: string;

  @Expose()
  lignesOuvrageArticleCount?: number;
}