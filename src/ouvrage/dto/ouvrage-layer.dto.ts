import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TypeLigneOuvrage } from '../../ligne-ouvrage/entities/ligne-ouvrage.entity';

export class LigneOuvrageArticleLayerDto {
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

export class LigneOuvrageLayerDto {
  @IsOptional()
  @IsUUID()
  ligneOuvrageId?: string;

  @IsNotEmpty()
  @IsEnum(TypeLigneOuvrage)
  typeLigneOuvrage: TypeLigneOuvrage;

  @IsInt()
  @IsNotEmpty()
  noOrdre: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LigneOuvrageArticleLayerDto)
  ligneOuvrageArticle?: LigneOuvrageArticleLayerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CommentaireDto)
  comment?: CommentaireDto;
}

export class OuvrageLayerDto {
  @IsNotEmpty()
  @IsUUID()
  catalogId: string;

  @IsOptional()
  @IsUUID()
  ouvrageId?: string;

  @IsOptional()
  @IsUUID()
  unitId?: string;

  @IsOptional()
  @IsArray()
  // @IsUUID(4, { each: true })
  familyIds?: string[];

  @IsNotEmpty()
  @IsString()
  designation: string;

  @IsOptional()
  @IsNumber()
  prix?: number;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneOuvrageLayerDto)
  lignesOuvrage: LigneOuvrageLayerDto[];
}
