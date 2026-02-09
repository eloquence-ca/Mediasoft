import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetUser } from 'src/auth/get-user.decorator';
import { User } from 'src/user/entities/user.entity';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entities/document.entity';
import { Public } from 'src/auth/jwt-auth.guard';
import { TransformToDto } from './dto/transorm-to.dto';
import { DOCUMENT_TYPE } from './enum';
import { ChangeStateDto } from './dto/change-state.dto';
import { BillingDto } from 'src/payment/dto/billing.dto';
import { InvoiceDto } from './dto/invoice.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('send/:id')
  @HttpCode(HttpStatus.OK)
  async send(@Param('id') id: string, @GetUser() user: User) {
    return this.documentService.sendDocument(id, user);
  }

  @Get('html/:id')
  @Public()
  @HttpCode(HttpStatus.OK)
  async html(@Param('id') id: string) {
    return this.documentService.getHtml(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau document',
    description:
      'Crée un document complet avec ses items, composants et adresses clonées',
  })
  @ApiResponse({
    status: 201,
    description: 'Document créé avec succès',
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Ressource non trouvée (adresse, client, etc.)',
  })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser() user: User,
  ): Promise<Document> {
    return this.documentService.create(
      createDocumentDto,
      user.idTenant,
      user.id,
    );
  }

  @Post('transform-to')
  @ApiOperation({
    summary: 'Transfomer des documents',
    description:
      'Créé de nouveaux documents cloné à partir de documents existants avec le type spécifié',
  })
  @ApiResponse({
    status: 201,
    description: 'Document créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Ressource non trouvée document source',
  })
  async transformTo(@Body() dto: TransformToDto, @GetUser() user: User) {
    return this.documentService.transformTo(dto, user);
  }

  @Post('billing')
  @ApiOperation({
    summary: 'Règlé des documents',
    description: 'Règlé des documents',
  })
  @ApiResponse({
    status: 200,
    description: 'Document règlé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Ressource non trouvée',
  })
  async billing(@Body() dto: BillingDto) {
    return this.documentService.billing(dto);
  }

  @Post('invoice')
  @ApiOperation({
    summary: "Faire une facture  d'acompte",
    description: "Faire une facture  d`'acompte",
  })
  @ApiResponse({
    status: 200,
    description: 'Acompte fait avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Ressource non trouvée',
  })
  async invoice(@Body() dto: InvoiceDto, @GetUser() user: User) {
    return this.documentService.invoice(dto, user);
  }

  @Post('change-state')
  @ApiOperation({
    summary: "Changer l'état d'un document",
    description: "Changé l'état d'un document avec le type spécifié",
  })
  @ApiResponse({
    status: 201,
    description: 'Etat mise à jour avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  async changeState(@Body() dto: ChangeStateDto, @GetUser() user: User) {
    return this.documentService.changeState(dto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un document complet',
    description:
      'Met à jour un document avec tous ses items, composants et adresses. Remplace complètement les données existantes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document mis à jour avec succès',
    type: Document,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 404,
    description: 'Document ou ressource liée non trouvée',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: CreateDocumentDto,
    @GetUser() user: User,
  ): Promise<Document> {
    return this.documentService.update(id, dto, user.idTenant, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les documents',
    description: 'Récupère la liste paginée des documents du tenant',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page (défaut: 10)",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des documents récupérée avec succès',
  })
  async findAll(
    @GetUser() user: User,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{
    documents: Document[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const result = await this.documentService.findAll(
      user.idTenant,
      +page,
      +limit,
    );

    return {
      ...result,
      currentPage: +page,
      totalPages: Math.ceil(result.total / +limit),
    };
  }

  @Get('by-company/:id')
  @ApiOperation({
    summary: 'Récupérer tous les documents',
    description: "Récupère la liste paginée des documents d'une société",
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Numéro de page (défaut: 1)',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    type: Number,
    description: 'Code du type de document',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: "Nombre d'éléments par page (défaut: 10)",
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des documents récupérée avec succès',
  })
  async findBycompany(
    @Param('id') id: string,
    @Query('code') code?: DOCUMENT_TYPE,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{
    documents: Document[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const result = await this.documentService.findByCompany(
      id,
      +page,
      +limit,
      code,
    );

    return {
      ...result,
      currentPage: +page,
      totalPages: Math.ceil(result.total / +limit),
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un document par ID',
    description:
      'Récupère un document avec toutes ses relations (items, composants, adresses, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Document trouvé',
    type: Document,
  })
  @ApiResponse({
    status: 404,
    description: 'Document non trouvé',
  })
  async findOne(@Param('id') id: string): Promise<Document> {
    return this.documentService.findOne(id);
  }

  @Patch(':id/billing-address')
  @ApiOperation({
    summary: "Mettre à jour l'adresse de facturation",
    description:
      "Clone une nouvelle adresse et l'associe comme adresse de facturation du document",
  })
  @ApiResponse({
    status: 200,
    description: 'Adresse de facturation mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Document ou adresse non trouvé',
  })
  async updateBillingAddress(
    @Param('id') documentId: string,
    @Body('addressId') addressId: string,
  ): Promise<{ message: string }> {
    await this.documentService.updateAddressClone(documentId, addressId, false);
    return { message: 'Adresse de facturation mise à jour avec succès' };
  }

  @Patch(':id/work-address')
  @ApiOperation({
    summary: "Mettre à jour l'adresse de travail",
    description:
      "Clone une nouvelle adresse et l'associe comme adresse de travail du document",
  })
  @ApiResponse({
    status: 200,
    description: 'Adresse de travail mise à jour avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Document ou adresse non trouvé',
  })
  async updateWorkAddress(
    @Param('id') documentId: string,
    @Body('addressId') addressId: string,
  ): Promise<{ message: string }> {
    await this.documentService.updateAddressClone(documentId, addressId, true);
    return { message: 'Adresse de travail mise à jour avec succès' };
  }

  @Get(':id/export')
  @ApiOperation({
    summary: 'Exporter un document',
    description: 'Génère un export du document (PDF, Excel, etc.)',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['pdf', 'excel'],
    description: "Format d'export (défaut: pdf)",
  })
  @ApiResponse({
    status: 200,
    description: 'Document exporté avec succès',
  })
  async exportDocument(
    @Param('id') id: string,
    @Query('format') format = 'pdf',
  ): Promise<{ message: string; exportUrl?: string }> {
    const document = await this.documentService.findOne(id);

    return {
      message: `Document ${document.code} exporté en ${format} avec succès`,
      exportUrl: `https://votre-domaine.com/exports/document-${id}.${format}`,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un document' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.documentService.remove(id);
  }
}
