import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ArticleLayerDto } from 'src/article/dto/article-layer.dto';
import { ArticleEntity } from 'src/article/entities/article.entity';
import { GetUser } from 'src/auth/get-user.decorator';
import { ALL_ROLES, Roles } from 'src/auth/role/roles.decorator';
import { FamilyLayerDto } from 'src/family/dto/family-layer.dto';
import { FamilyResponseDto } from 'src/family/dto/family-response.dto';
import { Family } from 'src/family/entities/family.entity';
import { OuvrageLayerDto } from 'src/ouvrage/dto/ouvrage-layer.dto';
import { Ouvrage } from 'src/ouvrage/entities/ouvrage.entity';
import { User } from 'src/user/entities/user.entity';
import { CatalogLayerService } from './catalog-layer.service';
import {
  CatalogMergeService,
  MergedArticle,
  MergedCatalog,
  MergedFamily,
  MergedOuvrage,
} from './catalog-merge.service';
import { CatalogService } from './catalog.service';
import {
  AssignCompaniesToCatalogDto,
  RemoveCompaniesFromCatalogDto,
} from './dto/assign-companies.dto';
import { CatalogResponseDto } from './dto/catalog-response.dto';
import { CreateCatalogDto } from './dto/create-catalog.dto';
import { UpdateCatalogDto } from './dto/update-catalog.dto';

@ApiTags('catalogues')
@ApiBearerAuth()
@Controller('catalogue')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly catalogMergeService: CatalogMergeService,
    private readonly catalogLayerService: CatalogLayerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer un catalogue' })
  @ApiResponse({ status: 201, type: CatalogResponseDto })
  @Roles(...ALL_ROLES)
  async create(
    @GetUser() user: User,
    @Body() dto: CreateCatalogDto,
  ): Promise<CatalogResponseDto> {
    if (!user.idTenant) {
      throw new BadRequestException("Aucun tenant associé à l'utilisateur");
    }
    return this.catalogService.create(dto, user.idTenant);
  }

  @ApiOperation({ summary: 'Lister les catalogues par tenant avec merge' })
  @ApiResponse({ status: 200, type: [MergedCatalog] })
  @Get('merge/catalogs-by-tenant')
  @Roles(...ALL_ROLES)
  async findCatalogsWithFamilies(@GetUser() user: User): Promise<any> {
    return this.catalogMergeService.getCatalogsWithFamilies(user.idTenant);
  }

  @ApiOperation({ summary: 'Récupérer un catalogue avec merge' })
  @ApiResponse({ status: 200, type: MergedCatalog })
  @Get('merge/catalog/:catalogId')
  @Roles(...ALL_ROLES)
  async findCatalog(
    @GetUser() user: User,
    @Param('catalogId') catalogId: string,
  ): Promise<any> {
    return this.catalogMergeService.getCatalog(catalogId, user.idTenant);
  }

  @ApiOperation({
    summary: "Lister les familles parent d'un catalogue avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedFamily] })
  @Get('merge/parents-families/:catalogId')
  @Roles(...ALL_ROLES)
  async findParentsFamilies(
    @Param('catalogId') catalogId: string,
    @GetUser() user: User,
  ): Promise<any> {
    return await this.catalogMergeService.getParentFamiliesForCatalog(
      catalogId,
      user.idTenant,
    );
  }

  @ApiOperation({
    summary: "Récupérer une famille d'un catalogue avec merge",
  })
  @ApiResponse({ status: 200, type: MergedFamily })
  @Get('merge/family/:familyId')
  @Roles(...ALL_ROLES)
  async findFamily(
    @Param('familyId') familyId: string,
    @GetUser() user: User,
  ): Promise<any> {
    return this.catalogMergeService.getFamily(familyId, user.idTenant);
  }

  @ApiOperation({
    summary: "Lister les sous familles d'un catalogue avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedFamily] })
  @Get('merge/family/:familyId/sub-family')
  @Roles(...ALL_ROLES)
  async findSubFamilies(
    @Param('familyId') familyId: string,
    @GetUser() user: User,
  ): Promise<any> {
    return this.catalogMergeService.getSubFamilies(familyId, user.idTenant);
  }

  @ApiOperation({
    summary: "Lister les acticles d'un catalogue avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedArticle] })
  @Get('merge/article-by-catalog/:catalogId')
  @Roles(...ALL_ROLES)
  async findArticlesByCatalog(
    @Param('catalogId') catalogId: string,
    @GetUser() user: User,
  ): Promise<MergedArticle[]> {
    return this.catalogMergeService.getArticlesForCatalog(
      catalogId,
      user.idTenant,
    );
  }

  @ApiOperation({
    summary: "Lister les acticles d'un tenant avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedArticle] })
  @Get('merge/article-by-tenant')
  @Roles(...ALL_ROLES)
  async findArticlesByTenant(@GetUser() user: User): Promise<MergedArticle[]> {
    return this.catalogMergeService.getArticles(user.idTenant);
  }

  @ApiOperation({
    summary: 'Récupérer un acticle avec merge',
  })
  @ApiResponse({ status: 200, type: MergedArticle })
  @Get('merge/article/:articleId')
  @Roles(...ALL_ROLES)
  async findArticle(
    @Param('articleId') articleId: string,
    @GetUser() user: User,
  ): Promise<MergedArticle> {
    return this.catalogMergeService.getArticle(articleId, user.idTenant);
  }

  @ApiOperation({
    summary: 'Récupérer un ouvrage avec merge',
  })
  @ApiResponse({ status: 200, type: MergedOuvrage })
  @Get('merge/ouvrage/:ouvrageId')
  @Roles(...ALL_ROLES)
  async findOuvrage(
    @Param('ouvrageId') ouvrageId: string,
    @GetUser() user: User,
  ): Promise<MergedOuvrage> {
    return this.catalogMergeService.getOuvrage(ouvrageId, user.idTenant);
  }

  @ApiOperation({
    summary: "Lister les acticles d'une famille avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedArticle] })
  @Get('merge/article-by-family/:familyId')
  @Roles(...ALL_ROLES)
  async findArticlesByFamily(
    @Param('familyId') familyId: string,
    @GetUser() user: User,
  ): Promise<MergedArticle[]> {
    return this.catalogMergeService.getArticlesForFamily(
      familyId,
      user.idTenant,
    );
  }

  @ApiOperation({
    summary: "Lister les ouvrages d'un catalogue avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedOuvrage] })
  @Get('merge/ouvrage-by-catalog/:catalogId')
  @Roles(...ALL_ROLES)
  async findOuvragesByCatalog(
    @Param('catalogId') catalogId: string,
    @GetUser() user: User,
  ): Promise<MergedOuvrage[]> {
    return this.catalogMergeService.getOuvragesForCatalog(
      catalogId,
      user.idTenant,
    );
  }

  @ApiOperation({
    summary: "Lister les ouvrages d'une famille avec merge",
  })
  @ApiResponse({ status: 200, type: [MergedOuvrage] })
  @Get('merge/ouvrage-by-family/:familyId')
  @Roles(...ALL_ROLES)
  async findOuvragesByFamily(
    @Param('familyId') familyId: string,
    @GetUser() user: User,
  ): Promise<MergedOuvrage[]> {
    return this.catalogMergeService.getOuvragesForFamily(
      familyId,
      user.idTenant,
    );
  }

  @Post('layer/family')
  @ApiOperation({ summary: 'Enregistrer une famille' })
  @ApiResponse({ status: 200, type: FamilyLayerDto })
  @Roles(...ALL_ROLES)
  async saveFamily(
    @GetUser() user: User,
    @Body() dto: FamilyLayerDto,
  ): Promise<Family> {
    return this.catalogLayerService.saveFamily(dto, user.idTenant);
  }

  @Post('layer/article')
  @ApiOperation({ summary: 'Enregistrer un article' })
  @ApiResponse({ status: 200, type: ArticleLayerDto })
  @Roles(...ALL_ROLES)
  async saveArticle(
    @GetUser() user: User,
    @Body() dto: ArticleLayerDto,
  ): Promise<ArticleEntity> {
    return this.catalogLayerService.saveArticle(dto, user.idTenant);
  }

  @Post('layer/ouvrage')
  @ApiOperation({ summary: 'Enregistrer un ouvrage' })
  @ApiResponse({ status: 200, type: Ouvrage })
  @Roles(...ALL_ROLES)
  async saveOuvrage(
    @GetUser() user: User,
    @Body() dto: OuvrageLayerDto,
  ): Promise<Ouvrage> {
    return this.catalogLayerService.saveOuvrage(dto, user.idTenant);
  }

  @Get(':catalogId/famille/:familyId/sous-familles')
  @ApiOperation({
    summary: "Récupérer les sous-familles d'une famille dans un catalogue",
  })
  @ApiResponse({ status: 200, type: [FamilyResponseDto] })
  @Roles(...ALL_ROLES)
  async getSubFamilies(
    @Param('catalogId') catalogId: string,
    @Param('familyId') familyId: string,
  ): Promise<FamilyResponseDto[]> {
    return this.catalogService.getSubFamilies(catalogId, familyId);
  }

  @Get(':catalogId/articles')
  @ApiOperation({ summary: "Récupérer tous les articles d'un catalogue" })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async getArticlesByCatalog(
    @Param('catalogId') catalogId: string,
  ): Promise<any> {
    return this.catalogService.getArticlesByCatalog(catalogId);
  }

  @Get(':catalogId/ouvrages')
  @ApiOperation({ summary: "Récupérer tous les ouvrages d'un catalogue" })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async getOuvragesByCatalog(
    @Param('catalogId') catalogId: string,
  ): Promise<any> {
    return this.catalogService.getOuvragesByCatalog(catalogId);
  }

  @Post(':catalogId/companies/assign')
  @ApiOperation({ summary: 'Affecter des sociétés à un catalogue' })
  @ApiResponse({ status: 201, description: 'Sociétés affectées avec succès' })
  @Roles(...ALL_ROLES)
  async assignCompaniesToCatalog(
    @Param('catalogId') catalogId: string,
    @Body() dto: AssignCompaniesToCatalogDto,
  ): Promise<void> {
    return this.catalogService.assignCompaniesToCatalog(
      catalogId,
      dto.companyIds,
    );
  }

  @Delete(':catalogId/companies/remove')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Retirer des sociétés d'un catalogue" })
  @ApiResponse({ status: 204, description: 'Sociétés retirées avec succès' })
  @Roles(...ALL_ROLES)
  async removeCompaniesFromCatalog(
    @Param('catalogId') catalogId: string,
    @Body() dto: RemoveCompaniesFromCatalogDto,
  ): Promise<void> {
    return this.catalogService.removeCompaniesFromCatalog(
      catalogId,
      dto.companyIds,
    );
  }

  @Get(':catalogId/companies')
  @ApiOperation({ summary: "Récupérer toutes les sociétés d'un catalogue" })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async getCatalogCompanies(
    @Param('catalogId') catalogId: string,
  ): Promise<any> {
    return this.catalogService.getCatalogCompanies(catalogId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un catalogue par ID' })
  @ApiResponse({ status: 200, type: CatalogResponseDto })
  @Roles(...ALL_ROLES)
  async findOne(@Param('id') id: string): Promise<CatalogResponseDto> {
    return this.catalogService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un catalogue' })
  @ApiResponse({ status: 200, type: CatalogResponseDto })
  @Roles(...ALL_ROLES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCatalogDto,
  ): Promise<CatalogResponseDto> {
    return this.catalogService.update(id, dto);
  }

  @Delete('/layer/article/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un article' })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async removeArticle(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.catalogLayerService.removeArticle(id, user.idTenant);
  }

  @Delete('/layer/ouvrage/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un ouvrage' })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async removeOuvrage(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.catalogLayerService.removeOuvrage(id, user.idTenant);
  }

  @Delete('/layer/family/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une famille' })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async removeFamily(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.catalogLayerService.removeFamily(id, user.idTenant);
  }

  @Delete('/layer/catalog/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un catalogue' })
  @ApiResponse({ status: 200 })
  @Roles(...ALL_ROLES)
  async removeCatalog(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.catalogLayerService.removeCatalog(id, user.idTenant);
  }
}
