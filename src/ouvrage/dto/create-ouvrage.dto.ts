import { IsNotEmpty, IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, IsEnum, ArrayMinSize } from "class-validator";
import { Type } from "class-transformer";
import { TypeLigneOuvrage } from "../../ligne-ouvrage/entities/ligne-ouvrage.entity";

export class LigneOuvrageArticleDto {
  @IsNotEmpty()
  @IsNumber()
  quantite: number;

  @IsNotEmpty()
  @IsUUID()
  articleId: string;
}

export class CommentaireDto {
  @IsOptional()
  @IsUUID()
  commentId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class LigneOuvrageDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsEnum(TypeLigneOuvrage)
  typeLigneOuvrage: TypeLigneOuvrage;

  @IsOptional()
  @IsUUID()
  articleId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LigneOuvrageArticleDto)
  lignesOuvrageArticle?: LigneOuvrageArticleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommentaireDto)
  comment?: CommentaireDto;
}

export class CreateOuvrageDto {
  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsOptional()
  @IsNumber()
  prix?: number;

  @IsNotEmpty()
  @IsUUID()
  catalogId: string;

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  familyIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneOuvrageDto)
  lignesOuvrage?: LigneOuvrageDto[];
}
