import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de réponse pour le chat avec l'agent IA
 * Structure claire et typée pour le client
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'Indique si la requête a réussi',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Réponse de l\'agent IA (présent si success = true)',
    example: 'Voici la liste des clients professionnels...',
  })
  answer?: string;

  @ApiPropertyOptional({
    description: 'Message d\'erreur (présent si success = false)',
    example: 'Agent IA non initialisé',
  })
  error?: string;

  @ApiProperty({
    description: 'Horodatage de la réponse',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Informations supplémentaires sur la réponse',
    example: { tokensUsed: 150, model: 'gemini-2.5-flash-lite' },
  })
  metadata?: {
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

