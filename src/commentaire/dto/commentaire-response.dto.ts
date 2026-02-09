import { Expose } from 'class-transformer';

export class CommentaireResponseDto {
  @Expose()
  id: string;

  @Expose()
  description: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  lignesOuvrageCount?: number;
}