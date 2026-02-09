import { PartialType } from '@nestjs/mapped-types';
import { CreateLigneOuvrageArticleDto } from './create-ligne-ouvrage-article.dto';

export class UpdateLigneOuvrageArticleDto extends PartialType(CreateLigneOuvrageArticleDto) {}