import { tool } from 'langchain';
import { CustomerService } from '../../customer/customer.service';
import { CatalogService } from '../../catalog/catalog.service';
import { formatResponseAsJson } from '../helpers/format-response.helper';
import { handleToolError } from '../helpers/error-handler.helper';

// Note: Ces outils utilisent des méthodes qui doivent être ajoutées aux services
// Si les méthodes n'existent pas encore, elles retourneront une erreur informative

/**
 * Crée des outils additionnels pour l'agent IA
 */
export function createAdditionalTools(
  _customerService: CustomerService,
  _catalogService: CatalogService,
  tenantId: string,
  userId: string,
) {
  return [
    // Outil pour rechercher des articles par code
    tool(
      async ({ code, catalogId }: { code: string; catalogId?: string }) => {
        try {
          if (!code || code.trim().length === 0) {
            return 'Code article invalide.';
          }

          // Recherche générique - adapter selon la implémentation du service
          return `Recherche de l'article avec le code "${code}"${catalogId ? ` dans le catalogue ${catalogId}` : ''}. Cette fonctionnalité nécessite l'implémentation de findArticlesByCode dans CatalogService.`;
        } catch (error) {
          return handleToolError(error, 'rechercher par code article');
        }
      },
      {
        name: 'search_articles_by_code',
        description: 'Rechercher des articles par leur code (référence produit).',
        schema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code ou référence de l\'article',
            },
            catalogId: {
              type: 'string',
              description: 'ID du catalogue optionnel pour limiter la recherche',
            },
          },
          required: ['code'],
        },
      },
    ),
  ];
}
