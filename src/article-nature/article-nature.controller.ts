import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ArticleNatureService } from './article-nature.service';
import { CreateArticleNatureDto } from './dto/create-article-nature.dto';
import { UpdateArticleNatureDto } from './dto/update-article-nature.dto';
import { ArticleNatureResponseDto } from './dto/article-nature-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { ROLES, Roles, ALL_ROLES } from 'src/auth/role/roles.decorator';

@ApiTags('article-nature')
@Controller('article-nature')
@ApiBearerAuth()
export class ArticleNatureController {
  constructor(private readonly articleNatureService: ArticleNatureService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle nature d\'article' })
  @ApiResponse({
    status: 201,
    description: 'Nature d\'article créée avec succès',
    type: ArticleNatureResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 409, description: 'Code de nature d\'article déjà utilisé' })
  @Roles(...ALL_ROLES)
  async create(
    @Body() createArticleNatureDto: CreateArticleNatureDto,
    @GetUser() user: User,
  ): Promise<ArticleNatureResponseDto> {
    return await this.articleNatureService.create(
      createArticleNatureDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer les natures d\'articles' })
  @ApiResponse({
    status: 200,
    description: 'Liste des natures d\'articles',
    type: [ArticleNatureResponseDto],
  })
  @Roles(...ALL_ROLES)
  async findAll(
    @Query('tenantId') tenantId?: string,
  ): Promise<ArticleNatureResponseDto[]> {
    if (tenantId) {
      return await this.articleNatureService.findByTenant(tenantId);
    }
    return await this.articleNatureService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une nature d\'article par son ID' })
  @ApiResponse({
    status: 200,
    description: 'Nature d\'article trouvée',
    type: ArticleNatureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Nature d\'article non trouvée' })
  @Roles(...ALL_ROLES)
  async findOne(@Param('id') id: string): Promise<ArticleNatureResponseDto> {
    return await this.articleNatureService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une nature d\'article' })
  @ApiResponse({
    status: 200,
    description: 'Nature d\'article mise à jour',
    type: ArticleNatureResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Nature d\'article non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @Roles(...ALL_ROLES)
  async update(
    @Param('id') id: string,
    @Body() updateArticleNatureDto: UpdateArticleNatureDto,
    @GetUser() user: User,
  ): Promise<ArticleNatureResponseDto> {
    return await this.articleNatureService.update(
      id,
      updateArticleNatureDto,
      user instanceof User ? user.id : undefined,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une nature d\'article' })
  @ApiResponse({ status: 204, description: 'Nature d\'article supprimée' })
  @ApiResponse({ status: 404, description: 'Nature d\'article non trouvée' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @Roles(...ALL_ROLES)
  async remove(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return await this.articleNatureService.remove(
      id,
      user instanceof User ? user.id : undefined,
    );
  }
}
