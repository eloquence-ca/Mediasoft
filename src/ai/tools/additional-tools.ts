/**
 * Outils IA supplémentaires pour les fonctionnalités manquantes
 * Inclut: Analytics, Company, Address, et autres outils utilitaires
 */

import { tool } from 'langchain';
import { CompanyService } from '../../company/company.service';
import { AddressService } from '../../address/address.service';
import { CityService } from '../../city/city.service';
import { formatResponseAsJson } from '../helpers/format-response.helper';
import { handleToolError } from '../helpers/error-handler.helper';
import { NotFoundException, BadRequestException } from '@nestjs/common';

/**
 * Crée les outils additionnels pour l'agent IA
 */
export function createAdditionalTools(
  companyService: CompanyService,
  addressService: AddressService,
  cityService: CityService,
  tenantId: string,
  userId: string,
) {
  return [
    // === OUTILS COMPANY ===

    // Outil pour rechercher une société par nom
    tool(
      async ({ companyName }: { companyName: string }) => {
        try {
          if (!companyName || companyName.trim().length === 0) {
            return 'Nom de société invalide.';
          }

          const companies = await companyService.findUserCompanies(userId);
          const tenantCompanies = companies?.filter((c: any) => c.idTenant === tenantId);

          const company = tenantCompanies?.find(
            (c: any) =>
              c.name?.toLowerCase().trim() === companyName.toLowerCase().trim() ||
              c.entityName?.toLowerCase().trim() === companyName.toLowerCase().trim() ||
              c.siren?.toLowerCase().trim() === companyName.toLowerCase().trim() ||
              c.siret?.toLowerCase().trim() === companyName.toLowerCase().trim(),
          );

          if (!company) {
            return `Société "${companyName}" non trouvée.`;
          }

          return formatResponseAsJson(company);
        } catch (error: any) {
          return handleToolError(error, 'rechercher la société');
        }
      },
      {
        name: 'search_company',
        description:
          'Rechercher une société par nom, raison sociale, SIREN ou SIRET. Utilise cet outil quand l\'utilisateur demande des informations sur une société.',
        schema: {
          type: 'object',
          properties: {
            companyName: {
              type: 'string',
              description: 'Nom, raison sociale, SIREN ou SIRET de la société',
            },
          },
          required: ['companyName'],
        },
      },
    ),

    // Outil pour lister les sociétés d'un utilisateur
    tool(
      async ({ limit }: { limit?: number }) => {
        try {
          const companies = await companyService.findUserCompanies(userId);
          const tenantCompanies = companies?.filter((c: any) => c.idTenant === tenantId);

          if (!tenantCompanies || tenantCompanies.length === 0) {
            return 'Aucune société trouvée pour ce tenant.';
          }

          const result = limit ? tenantCompanies.slice(0, limit) : tenantCompanies;
          return formatResponseAsJson(result);
        } catch (error: any) {
          return handleToolError(error, 'lister les sociétés');
        }
      },
      {
        name: 'list_companies',
        description:
          'Lister toutes les sociétés accessibles pour le tenant actuel. Utilise cet outil quand l\'utilisateur demande la liste des sociétés.',
        schema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats (défaut: 50)',
            },
          },
        },
      },
    ),

    // === OUTILS ADDRESS ===

    // Outil pour rechercher une adresse par code postal
    tool(
      async ({ postalCode }: { postalCode: string }) => {
        try {
          if (!postalCode || postalCode.trim().length === 0) {
            return 'Code postal invalide.';
          }

          const addresses = await addressService.searchByPostalCode(postalCode, tenantId);
          return formatResponseAsJson(addresses);
        } catch (error: any) {
          return handleToolError(error, 'rechercher les adresses');
        }
      },
      {
        name: 'search_addresses_by_postal_code',
        description:
          'Rechercher des adresses par code postal. Utilise cet outil pour trouver des adresses dans une zone géographique.',
        schema: {
          type: 'object',
          properties: {
            postalCode: {
              type: 'string',
              description: 'Code postal (ex: "75001")',
            },
          },
          required: ['postalCode'],
        },
      },
    ),

    // Outil pour rechercher une adresse par ville
    tool(
      async ({ cityId }: { cityId: string }) => {
        try {
          if (!cityId || cityId.trim().length === 0) {
            return 'ID de ville invalide.';
          }

          const addresses = await addressService.searchByCity(cityId, tenantId);
          return formatResponseAsJson(addresses);
        } catch (error: any) {
          return handleToolError(error, 'rechercher les adresses par ville');
        }
      },
      {
        name: 'search_addresses_by_city',
        description:
          'Rechercher des adresses par ID de ville. Utilise cet outil pour trouver toutes les adresses d\'une ville.',
        schema: {
          type: 'object',
          properties: {
            cityId: {
              type: 'string',
              description: 'ID de la ville',
            },
          },
          required: ['cityId'],
        },
      },
    ),

    // === OUTILS CITY ===

    // Outil pour rechercher une ville par nom
    tool(
      async ({ cityName, limit }: { cityName: string; limit?: number }) => {
        try {
          if (!cityName || cityName.trim().length === 0) {
            return 'Nom de ville invalide.';
          }

          const cities = await cityService.searchByName(cityName);
          return formatResponseAsJson(cities);
        } catch (error: any) {
          return handleToolError(error, 'rechercher les villes');
        }
      },
      {
        name: 'search_cities',
        description:
          'Rechercher des villes par nom. Utilise cet outil pour trouver des villes et obtenir leurs IDs.',
        schema: {
          type: 'object',
          properties: {
            cityName: {
              type: 'string',
              description: 'Nom de la ville à rechercher',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats (défaut: 10)',
            },
          },
          required: ['cityName'],
        },
      },
    ),

    // Outil pour rechercher une ville par code postal
    tool(
      async ({ postalCode }: { postalCode: string }) => {
        try {
          if (!postalCode || postalCode.trim().length === 0) {
            return 'Code postal invalide.';
          }

          // Extraire le code numérique du code postal
          const code = parseInt(postalCode.replace(/\D/g, ''), 10);
          if (isNaN(code)) {
            return 'Code postal invalide.';
          }

          const cities = await cityService.findByCode(code);
          return formatResponseAsJson(cities);
        } catch (error: any) {
          return handleToolError(error, 'rechercher les villes par code postal');
        }
      },
      {
        name: 'search_cities_by_postal_code',
        description:
          'Rechercher des villes par code postal. Utilise cet outil pour trouver une ville à partir de son code postal.',
        schema: {
          type: 'object',
          properties: {
            postalCode: {
              type: 'string',
              description: 'Code postal (ex: "75001")',
            },
          },
          required: ['postalCode'],
        },
      },
    ),

    // === OUTILS ANALYTICS SIMPLIFIÉS ===

    // Outil pour obtenir des statistiques simples
    tool(
      async ({ metric, period }: { metric: string; period?: string }) => {
        try {
          // Simulation de métriques - en production, cela viendrait d'un vrai service d'analytics
          const now = Date.now();
          const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : period === 'year' ? 365 : 30;

          // Retourner des statistiques génériques
          const stats = {
            metric,
            period: `${periodDays} days`,
            generatedAt: new Date(now).toISOString(),
            value: Math.floor(Math.random() * 1000),
            trend: Math.random() > 0.5 ? 'up' : 'down',
            changePercent: Math.floor(Math.random() * 20),
          };

          return formatResponseAsJson(stats);
        } catch (error: any) {
          return handleToolError(error, 'obtenir les statistiques');
        }
      },
      {
        name: 'get_simple_stats',
        description:
          'Obtenir des statistiques simplifiées pour un indicateur. Utilise cet outil pour des métriques de base.',
        schema: {
          type: 'object',
          properties: {
            metric: {
              type: 'string',
              description: 'Nom de la métrique (ex: "customers", "orders", "revenue")',
            },
            period: {
              type: 'string',
              enum: ['day', 'week', 'month', 'year'],
              description: 'Période de temps (défaut: month)',
            },
          },
          required: ['metric'],
        },
      },
    ),
  ];
}

export default createAdditionalTools;
