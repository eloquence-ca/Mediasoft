import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommentaireService } from './commentaire.service';
import { CreateCommentaireDto } from './dto/create-commentaire.dto';
import { UpdateCommentaireDto } from './dto/update-commentaire.dto';
import { CommentaireResponseDto } from './dto/commentaire-response.dto';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('commentaires')
@ApiBearerAuth()
@Controller('commentaires')
export class CommentaireController {
  constructor(private readonly commentaireService: CommentaireService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un commentaire' })
  @ApiResponse({ status: 201, type: CommentaireResponseDto })
  async create(@Body() dto: CreateCommentaireDto): Promise<CommentaireResponseDto> {
    return this.commentaireService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les commentaires' })
  @ApiResponse({ status: 200, type: [CommentaireResponseDto] })
  async findAll(): Promise<CommentaireResponseDto[]> {
    return this.commentaireService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un commentaire par ID' })
  @ApiResponse({ status: 200, type: CommentaireResponseDto })
  async findOne(@Param('id') id: string): Promise<CommentaireResponseDto> {
    return this.commentaireService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un commentaire' })
  @ApiResponse({ status: 200, type: CommentaireResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentaireDto,
  ): Promise<CommentaireResponseDto> {
    return this.commentaireService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un commentaire' })
  @ApiResponse({ status: 204 })
  async remove(@Param('id') id: string): Promise<void> {
    return this.commentaireService.remove(id);
  }
}