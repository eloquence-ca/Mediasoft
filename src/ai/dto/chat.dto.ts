import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour le chat avec l'agent IA
 */
export class ChatDto {
  @ApiProperty({
    example: 'Affiche-moi tous les clients de type PROFESSIONAL',
    description: 'Message à envoyer à l\'agent IA',
  })
  @IsNotEmpty({ message: 'Le message est requis' })
  @IsString({ message: 'Le message doit être une chaîne de caractères' })
  message: string;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID du tenant pour filtrer les données. Si non fourni, utilise le tenantId de l\'utilisateur authentifié.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Le tenantId doit être un UUID valide' })
  tenantId?: string;
}

