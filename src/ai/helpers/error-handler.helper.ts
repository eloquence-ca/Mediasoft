/**
 * Helper pour gérer les erreurs de manière cohérente dans les outils IA
 * Retourne des messages d'erreur clairs et sans IDs techniques
 */

import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Extrait un message d'erreur lisible depuis une exception
 */
export function getErrorMessage(error: any): string {
  if (!error) {
    return 'Une erreur inattendue est survenue.';
  }

  // Gérer les exceptions NestJS
  if (error instanceof NotFoundException) {
    return 'Élément non trouvé.';
  }

  if (error instanceof BadRequestException) {
    const message = error.message || 'Requête invalide.';
    // Supprimer les IDs du message
    return message.replace(/ID\s+[a-f0-9-]+/gi, '').trim() || 'Requête invalide.';
  }

  // Gérer les erreurs avec message
  if (error.message) {
    const message = error.message;
    
    // Messages d'erreur spécifiques à éviter
    const technicalPatterns = [
      /ID\s+[a-f0-9-]+/gi,
      /uuid/gi,
      /tenantId/gi,
      /customerId/gi,
      /documentId/gi,
      /catalogId/gi,
    ];

    let cleanMessage = message;
    for (const pattern of technicalPatterns) {
      cleanMessage = cleanMessage.replace(pattern, '');
    }

    // Messages d'erreur courants à traduire
    if (cleanMessage.includes('not found') || cleanMessage.includes('introuvable')) {
      return 'Élément non trouvé.';
    }

    if (cleanMessage.includes('invalid') || cleanMessage.includes('invalide')) {
      return 'Données invalides.';
    }

    if (cleanMessage.includes('permission') || cleanMessage.includes('unauthorized')) {
      return 'Accès non autorisé.';
    }

    if (cleanMessage.includes('timeout') || cleanMessage.includes('ECONNREFUSED')) {
      return 'Délai d\'attente dépassé. Veuillez réessayer.';
    }

    // Retourner le message nettoyé
    return cleanMessage.trim() || 'Une erreur est survenue lors de l\'opération.';
  }

  // Erreur inconnue
  return 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

/**
 * Gère une erreur dans un outil et retourne un message formaté
 */
export function handleToolError(error: any, context: string): string {
  const message = getErrorMessage(error);
  return `Impossible de ${context}. ${message}`;
}

