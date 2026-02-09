import { PartialType } from '@nestjs/mapped-types';
import { CreateOuvrageDto } from './create-ouvrage.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOuvrageDto extends PartialType(CreateOuvrageDto) {
  @IsOptional()
  @IsString()
  version?: string; // Timestamp de la dernière modification pour le verrouillage optimiste
}
