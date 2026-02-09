import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArticleNature } from './entities/article-nature.entity';
import { CreateArticleNatureDto } from './dto/create-article-nature.dto';
import { UpdateArticleNatureDto } from './dto/update-article-nature.dto';
import { ArticleNatureResponseDto } from './dto/article-nature-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ArticleNatureService {
  constructor(
    @InjectRepository(ArticleNature)
    private readonly articleNatureRepository: Repository<ArticleNature>,
  ) {}

  async create(
    createArticleNatureDto: CreateArticleNatureDto,
  ): Promise<ArticleNatureResponseDto> {
    // Vérification de l'unicité du code
    const exists = await this.articleNatureRepository.findOne({
      where: { code: createArticleNatureDto.code },
    });
  
    if (exists) {
      throw new ConflictException(
        `Une nature d'article avec le code "${createArticleNatureDto.code}" existe déjà`,
      );
    }
  
    // Création de l'entité
    const articleNature = this.articleNatureRepository.create(createArticleNatureDto);
  
    // Sauvegarde
    const saved = await this.articleNatureRepository.save(articleNature);
  
    // Mapping vers le DTO de réponse
    return this.mapToResponseDto(saved);
  }
  

  async findAll(): Promise<ArticleNatureResponseDto[]> {
    const articleNatures = await this.articleNatureRepository.find({
      relations: ['articles'],
    });
    return articleNatures.map((articleNature) => this.mapToResponseDto(articleNature));
  }

  async findByTenant(tenantId: string): Promise<ArticleNatureResponseDto[]> {
    const articleNatures = await this.articleNatureRepository.find({
      relations: ['articles'],
    });
    
    return articleNatures.map((articleNature) =>
      this.mapToResponseDto(articleNature),
    );
  }

  async findOne(id: string): Promise<ArticleNatureResponseDto> {
    const articleNature = await this.articleNatureRepository.findOne({
      where: { id },
      relations: ['articles'],
    });

    if (!articleNature) {
      throw new NotFoundException('Nature d\'article non trouvée');
    }

    return this.mapToResponseDto(articleNature);
  }

  async update(
    id: string,
    updateArticleNatureDto: UpdateArticleNatureDto,
    updatedByUserId?: string,
  ): Promise<ArticleNatureResponseDto> {
    const articleNature = await this.articleNatureRepository.findOne({
      where: { id },
    });

    if (!articleNature) {
      throw new NotFoundException('Nature d\'article non trouvée');
    }

    if (updateArticleNatureDto.code && updateArticleNatureDto.code !== articleNature.code) {
      const existingArticleNature = await this.articleNatureRepository.findOne({
        where: { code: updateArticleNatureDto.code },
      });

      if (existingArticleNature) {
        throw new ConflictException(
          'Une nature d\'article avec ce code existe déjà',
        );
      }
    }

    Object.assign(articleNature, updateArticleNatureDto);
    const savedArticleNature = await this.articleNatureRepository.save(articleNature);

    return this.mapToResponseDto(savedArticleNature);
  }

  async remove(id: string, deletedByUserId?: string): Promise<void> {
    const articleNature = await this.articleNatureRepository.findOne({
      where: { id },
      relations: ['articles'],
    });

    if (!articleNature) {
      throw new NotFoundException('Nature d\'article non trouvée');
    }

    if (articleNature.articles && articleNature.articles.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer cette nature d\'article car elle est utilisée par des articles',
      );
    }

    await this.articleNatureRepository.remove(articleNature);
  }

  private mapToResponseDto(articleNature: any): ArticleNatureResponseDto {
    const dto = plainToClass(ArticleNatureResponseDto, articleNature);

    if (articleNature.articles) {
      dto.articlesCount = articleNature.articles.filter((article: any) => !article.isDeleted).length;
    }

    return dto;
  }
}
