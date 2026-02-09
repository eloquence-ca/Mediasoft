import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { ChatDto } from './dto/chat.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

/**
 * Controller pour gérer les endpoints de l'agent IA
 * Tous les endpoints sont préfixés par /ai
 * Tous les endpoints nécessitent une authentification JWT
 */
@ApiTags('AI Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Chat avec l'agent IA en langage naturel
   * Retourne une réponse structurée et typée
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Chat avec l\'agent IA',
    description: 'Posez une question en langage naturel sur vos données. L\'agent IA analysera votre question et utilisera les outils disponibles pour vous fournir une réponse précise.',
  })
  @ApiBody({ 
    type: ChatDto,
    description: 'Message à envoyer à l\'agent IA',
  })
  @ApiResponse({
    status: 200,
    description: 'Réponse de l\'agent IA avec succès',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Requête invalide (message vide)',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur',
  })
  async chat(
    @Body() chatDto: ChatDto,
    @GetUser() user: User,
  ): Promise<ChatResponseDto> {
    // Utiliser le tenantId fourni dans la requête, ou celui de l'utilisateur authentifié
    const tenantId = chatDto.tenantId || user.idTenant;
    return this.aiService.chat(chatDto.message, user.id, tenantId);
  }
}
