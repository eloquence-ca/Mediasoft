import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Res, Get, Header } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { ChatDto } from './dto/chat.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { SSEUtils, StreamingHandler, StreamingConfig, SSEEventType } from './helpers/streaming.helper';

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

  /**
   * Chat streaming avec l'agent IA (Server-Sent Events)
   * Retourne la réponse en streaming pour une meilleure UX
   */
  @Post('chat/stream')
  @ApiOperation({
    summary: 'Chat streaming avec l\'agent IA',
    description: 'Posez une question en langage naturel et recevez la réponse en streaming (Server-Sent Events).',
  })
  @ApiBody({ 
    type: ChatDto,
    description: 'Message à envoyer à l\'agent IA',
  })
  @ApiResponse({
    status: 200,
    description: 'Flux SSE avec la réponse progressive',
  })
  @ApiResponse({
    status: 400,
    description: 'Requête invalide',
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async chatStream(
    @Body() chatDto: ChatDto,
    @GetUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const tenantId = chatDto.tenantId || user.idTenant;
    const message = chatDto.message;

    // Configuration du streaming
    const streamingConfig: StreamingConfig = {
      chunkDelay: 30, // ms entre chaque chunk
    };

    // Configurer les headers SSE
    res.set(SSEUtils.headers);
    res.set('Retry-Age', String(3000));

    try {
      // Envoyer l'événement de début
      res.write(SSEUtils.event(SSEEventType.START, { 
        message: 'Début du traitement',
        userId: user.id,
        tenantId,
      }));

      // Obtenir ou créer l'agent
      const agent = await this.aiService['getOrCreateAgent'](user.id, tenantId);
      
      if (!agent) {
        res.write(SSEUtils.event(SSEEventType.ERROR, { 
          error: 'Agent IA non initialisé',
        }));
        res.end();
        return;
      }

      // Créer le handler de streaming
      const handler = new StreamingHandler(streamingConfig);

      // Si l'agent supporte le streaming
      if (agent.stream) {
        const response = agent.stream({
          messages: [{ role: 'user', content: message }],
        });

        for await (const chunk of response) {
          const content = chunk?.content || chunk?.text || chunk?.output || JSON.stringify(chunk);
          if (content) {
            handler.addToken(content);
            res.write(SSEUtils.event(SSEEventType.TOKEN, { chunk: content }));
          }

          // Enregistrer les outils appelés
          if (chunk?.tool_calls) {
            for (const toolCall of chunk.tool_calls) {
              handler.addToolCall(toolCall.name, toolCall.args);
              res.write(SSEUtils.event(SSEEventType.TOOL_CALL, { 
                tool: toolCall.name, 
                args: toolCall.args 
              }));
            }
          }

          // Flush pour envoyer immédiatement (res.flush n'est pas disponible dans Express Response)
          // res.flush?.();
        }
      } else {
        // Fallback: mode classique
        const result = await agent.invoke({
          messages: [{ role: 'user', content: message }],
        });

        const content = result?.output || result?.content || JSON.stringify(result);
        if (content) {
          handler.addToken(content);
          
          // Émettre en chunks
          const chunks = content.match(/.{1,50}/g) || [content];
          for (const chunk of chunks) {
            res.write(SSEUtils.event(SSEEventType.TOKEN, { chunk }));
            await new Promise((resolve) => setTimeout(resolve, streamingConfig.chunkDelay));
          }
        }
      }

      // Envoyer l'événement de fin
      res.write(SSEUtils.event(SSEEventType.COMPLETE, {
        fullResponse: handler.getFullResponse(),
        totalTime: handler.getTotalTime(),
        toolsUsed: handler.getToolsUsed(),
      }));

    } catch (error) {
      res.write(SSEUtils.event(SSEEventType.ERROR, { 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }));
    }

    res.end();
  }
}
