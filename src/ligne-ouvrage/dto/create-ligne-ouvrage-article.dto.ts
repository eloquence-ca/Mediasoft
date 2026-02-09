import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class CreateLigneOuvrageArticleDto {
  @IsNotEmpty()
  @IsNumber()
  quantite: number;

  @IsNotEmpty()
  @IsUUID()
  ligneOuvrageId: string;

  @IsNotEmpty()
  @IsUUID()
  articleId: string;
}