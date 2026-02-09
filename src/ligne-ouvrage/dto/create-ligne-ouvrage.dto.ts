import { IsNotEmpty, IsNumber, IsOptional, IsUUID, IsEnum } from "class-validator";
import { TypeLigneOuvrage } from '../entities/ligne-ouvrage.entity';

export class CreateLigneOuvrageDto {
  @IsNotEmpty()
  @IsNumber()
  noOrdre: number;

  @IsNotEmpty()
  @IsEnum(TypeLigneOuvrage)
  typeLigneOuvrage: TypeLigneOuvrage;

  @IsNotEmpty()
  @IsUUID()
  ouvrageId: string;

  @IsOptional()
  @IsUUID()
  commentaireId?: string;
}