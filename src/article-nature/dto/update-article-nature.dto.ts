import { PartialType } from '@nestjs/swagger';
import { CreateArticleNatureDto } from './create-article-nature.dto';

export class UpdateArticleNatureDto extends PartialType(CreateArticleNatureDto) {}
