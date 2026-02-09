import { PartialType } from '@nestjs/mapped-types';
import { CreateLigneOuvrageDto } from './create-ligne-ouvrage.dto';

export class UpdateLigneOuvrageDto extends PartialType(CreateLigneOuvrageDto) {}