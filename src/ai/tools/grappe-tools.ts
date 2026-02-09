import { tool } from 'langchain';
import { CustomerService } from '../../customer/customer.service';
import { CatalogService } from '../../catalog/catalog.service';
import { CatalogMergeService } from '../../catalog/catalog-merge.service';
import { CatalogLayerService } from '../../catalog/catalog-layer.service';
import { CompanyService } from '../../company/company.service';
import { DocumentService } from '../../document/document.service';
import { UserService } from '../../user/user.service';
import { TvaRateService } from '../../tva-rate/tva-rate.service';
import { DocumentTypeService } from '../../document/document-type.service';
import { TYPE_CUSTOMER } from '../../customer/entities/customer.entity';
import { DOCUMENT_TYPE } from '../../document/enum';
import { formatResponseAsJson } from '../helpers/format-response.helper';
import { handleToolError, getErrorMessage } from '../helpers/error-handler.helper';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { 
  normalizeString, 
  findBestMatch, 
  findAllMatches,
  getSuggestions 
} from '../helpers/fuzzy-search.helper';

/**
 * Fonctions helper pour rechercher par nom au lieu d'ID
 */
async function findCatalogByName( 
  catalogService: CatalogService,
  catalogMergeService: CatalogMergeService,
  catalogName: string,
  tenantId: string,
  includeAllElements: boolean = false,
): Promise<any> {
  const catalogs = await catalogMergeService.getCatalogsWithFamilies(tenantId);
  const catalog = catalogs.find(
    (c) => c.name?.toLowerCase().trim() === catalogName.toLowerCase().trim(),
  );
  if (!catalog) {
    throw new NotFoundException(`Catalogue "${catalogName}" non trouvé.`);
  }
  
  // Si on veut tous les éléments, enrichir le catalogue
  if (includeAllElements) {
    const [articles, ouvrages] = await Promise.all([
      catalogMergeService.getArticlesForCatalog(catalog.catalogId, tenantId),
      catalogMergeService.getOuvragesForCatalog(catalog.catalogId, tenantId),
    ]);
    
    return {
      ...catalog,
      articles: articles || [],
      ouvrages: ouvrages || [],
      stats: {
        totalArticles: articles?.length || 0,
        totalOuvrages: ouvrages?.length || 0,
        totalFamilies: catalog.families?.length || 0,
      },
    };
  }
  
  return catalog;
}

async function findArticleByNameOrCode(
  catalogMergeService: CatalogMergeService,
  articleNameOrCode: string,
  catalogId?: string,
  tenantId?: string,
): Promise<any> {
  if (!tenantId) {
    throw new BadRequestException('tenantId est requis pour rechercher un article.');
  }
  
  let articles: any[];
  if (catalogId) {
    articles = await catalogMergeService.getArticlesForCatalog(catalogId, tenantId);
  } else {
    articles = await catalogMergeService.getArticles(tenantId);
  }
  
  const article = articles.find(
    (a) =>
      a.name?.toLowerCase().trim() === articleNameOrCode.toLowerCase().trim() ||
      a.code?.toLowerCase().trim() === articleNameOrCode.toLowerCase().trim(),
  );
  
  if (!article) {
    throw new NotFoundException(`Article "${articleNameOrCode}" non trouvé.`);
  }
  return article;
}

async function findFamilyByName(
  catalogMergeService: CatalogMergeService,
  familyName: string,
  catalogId: string,
  tenantId: string,
): Promise<any> {
  const catalog = await catalogMergeService.getCatalog(catalogId, tenantId);
  const family = catalog.families?.find(
    (f: any) => f.name?.toLowerCase().trim() === familyName.toLowerCase().trim(),
  );
  if (!family) {
    throw new NotFoundException(`Famille "${familyName}" non trouvée dans le catalogue.`);
  }
  return family;
}

async function findOuvrageByDesignation(
  catalogMergeService: CatalogMergeService,
  designation: string,
  catalogId: string,
  tenantId: string,
): Promise<any> {
  // Récupérer les ouvrages du catalogue spécifique
  const ouvrages = await catalogMergeService.getOuvragesForCatalog(catalogId, tenantId);
  const ouvrage = ouvrages.find(
    (o: any) => o.designation?.toLowerCase().trim() === designation.toLowerCase().trim(),
  );
  if (!ouvrage) {
    throw new NotFoundException(`Ouvrage "${designation}" non trouvé dans le catalogue.`);
  }
  return ouvrage;
}

async function findCompanyByName(
  companyService: CompanyService,
  companyName: string,
  userId: string,
  tenantId: string,
): Promise<any> {
  const companies = await companyService.findUserCompanies(userId);
  const tenantCompanies = companies?.filter((c: any) => c.idTenant === tenantId);
  const company = tenantCompanies?.find(
    (c: any) =>
      c.name?.toLowerCase().trim() === companyName.toLowerCase().trim() ||
      c.entityName?.toLowerCase().trim() === companyName.toLowerCase().trim(),
  );
  if (!company) {
    throw new NotFoundException(`Société "${companyName}" non trouvée.`);
  }
  return company;
}

/**
 * Crée les outils LangChain pour interagir avec les données Grappe
 * Ces outils permettent à l'agent IA d'accéder aux données réelles
 */
export function createGrappeTools(
  customerService: CustomerService,
  catalogService: CatalogService,
  catalogMergeService: CatalogMergeService,
  catalogLayerService: CatalogLayerService,
  companyService: CompanyService,
  documentService: DocumentService,
  userService: UserService,
  tvaRateService: TvaRateService,
  documentTypeService: DocumentTypeService,
  tenantId: string,
  userId: string,
) {
  return [
    // Outil pour rechercher des clients
    tool(
      async ({ 
        companyId, 
        directoryId, 
        type, 
        customerId, 
        withDetails, 
        search,
        createdAtFrom,
        createdAtTo,
        updatedAtFrom,
        updatedAtTo,
        limit: resultLimit
      }: {
        companyId?: string;
        directoryId?: string;
        type?: TYPE_CUSTOMER;
        customerId?: string;
        withDetails?: boolean;
        search?: string;
        createdAtFrom?: string; // Format ISO date string
        createdAtTo?: string; // Format ISO date string
        updatedAtFrom?: string; // Format ISO date string
        updatedAtTo?: string; // Format ISO date string
        limit?: number; // Limite de résultats (défaut: 200)
      }) => {
        try {
          // Recherche par ID client spécifique
          if (customerId) {
            if (!customerId || customerId.trim().length === 0) {
              return 'Identifiant de client invalide.';
            }
            
            let customer;
            try {
              customer = withDetails
                ? await customerService.findOneWithDetails(customerId)
                : await customerService.findOne(customerId);
            } catch (error) {
              if (error instanceof NotFoundException) {
                return 'Client non trouvé.';
              }
              throw error;
            }

            if (!customer) {
              return 'Client non trouvé.';
            }

            // Vérifier que le client appartient au tenant
            if (customer.directory?.idTenant !== tenantId) {
              return 'Client non accessible pour ce tenant.';
            }
            return formatResponseAsJson(customer);
          }

          // Valider les paramètres
          if (directoryId && (!directoryId || directoryId.trim().length === 0)) {
            return 'Identifiant de répertoire invalide.';
          }
          if (companyId && (!companyId || companyId.trim().length === 0)) {
            return 'Identifiant de société invalide.';
          }
          if (search && (!search || search.trim().length === 0)) {
            return 'Terme de recherche invalide.';
          }

          // Utiliser la nouvelle méthode findWithFilters qui gère tous les filtres combinés
          const limit = resultLimit && resultLimit > 0 ? Math.min(resultLimit, 300) : 200;
          let customers = await customerService.findWithFilters(tenantId, {
            type,
            directoryId,
            companyId,
            search: search?.trim(),
            limit,
          });

          // S'assurer que customers est un tableau
          if (!Array.isArray(customers) || customers.length === 0) {
            // Message d'erreur personnalisé selon les filtres utilisés
            const filtersUsed: string[] = [];
            if (type) filtersUsed.push(`type ${type}`);
            if (search) filtersUsed.push(`recherche "${search}"`);
            if (directoryId) filtersUsed.push('répertoire spécifié');
            if (companyId) filtersUsed.push('société spécifiée');
            
            if (filtersUsed.length > 0) {
              return `Aucun client trouvé avec les critères suivants : ${filtersUsed.join(', ')}.`;
            }
            return 'Aucun client trouvé.';
          }

          // Filtrer par date de création
          if (createdAtFrom) {
            const fromDate = new Date(createdAtFrom);
            customers = customers.filter((customer) => {
              const customerDate = new Date(customer.createdAt);
              return customerDate >= fromDate;
            });
          }
          if (createdAtTo) {
            const toDate = new Date(createdAtTo);
            toDate.setHours(23, 59, 59, 999);
            customers = customers.filter((customer) => {
              const customerDate = new Date(customer.createdAt);
              return customerDate <= toDate;
            });
          }

          // Filtrer par date de mise à jour
          if (updatedAtFrom) {
            const fromDate = new Date(updatedAtFrom);
            customers = customers.filter((customer) => {
              const customerDate = new Date(customer.updatedAt);
              return customerDate >= fromDate;
            });
          }
          if (updatedAtTo) {
            const toDate = new Date(updatedAtTo);
            toDate.setHours(23, 59, 59, 999);
            customers = customers.filter((customer) => {
              const customerDate = new Date(customer.updatedAt);
              return customerDate <= toDate;
            });
          }

          if (customers.length === 0) {
            return 'Aucun client trouvé avec les critères spécifiés.';
          }

          return formatResponseAsJson(customers);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les clients');
        }
      },
      {
        name: 'search_customers',
        description:
          'Rechercher des clients par différents critères avancés (nom, email, code, type, société, répertoire, dates) ou lister tous les clients. Utilise cet outil quand l\'utilisateur demande des informations sur les clients avec des filtres spécifiques. IMPORTANT: Pour lister tous les clients d\'un type spécifique (ex: "tous les clients professionnels", "tous les particuliers"), utilise uniquement le paramètre "type" sans autres critères. Supporte la recherche textuelle par nom, email ou code. Les filtres peuvent être combinés (ex: type + recherche textuelle, société + type, dates + type). Les résultats sont automatiquement filtrés par tenant et formatés sans IDs techniques.',
        schema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Identifiant technique de la société pour filtrer les clients (usage interne uniquement)',
            },
            directoryId: {
              type: 'string',
              description: 'Identifiant technique du répertoire pour filtrer les clients (usage interne uniquement)',
            },
            type: {
              type: 'string',
              enum: ['INDIVIDUAL', 'PROFESSIONAL', 'PUBLIC_ENTITY'],
              description: 'Type de client : INDIVIDUAL (particulier), PROFESSIONAL (professionnel), ou PUBLIC_ENTITY (entité publique)',
            },
            customerId: {
              type: 'string',
              description: 'Identifiant technique d\'un client spécifique (usage interne uniquement)',
            },
            withDetails: {
              type: 'boolean',
              description: 'Inclure les détails complets du client (contacts, adresses, etc.)',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle par nom, prénom, email, code ou raison sociale. Recherche flexible et performante.',
            },
            createdAtFrom: {
              type: 'string',
              description: 'Date de création minimale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-01-01"',
            },
            createdAtTo: {
              type: 'string',
              description: 'Date de création maximale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-12-31"',
            },
            updatedAtFrom: {
              type: 'string',
              description: 'Date de mise à jour minimale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-01-01"',
            },
            updatedAtTo: {
              type: 'string',
              description: 'Date de mise à jour maximale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-12-31"',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats à retourner (défaut: 200, maximum: 300)',
            },
          },
        },
      },
    ),

    // Outil pour obtenir les contacts d'un client
    tool(
      async ({ customerId }: { customerId: string }) => {
        try {
          if (!customerId || customerId.trim().length === 0) {
            return 'Identifiant de client invalide.';
          }

          let contacts;
          try {
            contacts = await customerService.getCustomerContacts(customerId);
          } catch (error) {
            if (error instanceof NotFoundException) {
              return 'Client non trouvé.';
            }
            throw error;
          }

          if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
            return 'Aucun contact trouvé pour ce client.';
          }
          return formatResponseAsJson(contacts);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les contacts');
        }
      },
      {
        name: 'get_customer_contacts',
        description:
          'Obtenir les contacts d\'un client. Utilise cet outil quand l\'utilisateur demande les contacts d\'un client spécifique.',
        schema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID du client',
            },
          },
          required: ['customerId'],
        },
      },
    ),

    // Outil pour obtenir les adresses d'un client
    tool(
      async ({ customerId }: { customerId: string }) => {
        try {
          if (!customerId || customerId.trim().length === 0) {
            return 'Identifiant de client invalide.';
          }

          let addresses;
          try {
            addresses = await customerService.getCustomerAddresses(customerId);
          } catch (error) {
            if (error instanceof NotFoundException) {
              return 'Client non trouvé.';
            }
            throw error;
          }

          if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
            return 'Aucune adresse trouvée pour ce client.';
          }
          return formatResponseAsJson(addresses);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les adresses');
        }
      },
      {
        name: 'get_customer_addresses',
        description:
          'Obtenir les adresses d\'un client. Utilise cet outil quand l\'utilisateur demande les adresses d\'un client spécifique.',
        schema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID du client',
            },
          },
          required: ['customerId'],
        },
      },
    ),

    // Outil pour rechercher des catalogues
    tool(
      async ({ catalogName, catalogId, search, withDetails }: { 
        catalogName?: string;
        catalogId?: string;
        search?: string;
        withDetails?: boolean;
      }) => {
        try {
          // Recherche par nom de catalogue
          if (catalogName) {
            // Toujours inclure tous les éléments pour un catalogue spécifique
            const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId, true);
            return formatResponseAsJson(catalog);
          }

          // Recherche par ID (fallback pour usage technique)
          if (catalogId) {
            if (!catalogId || catalogId.trim().length === 0) {
              return 'Identifiant de catalogue invalide.';
            }

            let catalog;
            try {
              if (withDetails) {
                // Récupérer le catalogue avec merge et enrichir avec articles et ouvrages
                catalog = await catalogMergeService.getCatalog(catalogId, tenantId);
                const [articles, ouvrages] = await Promise.all([
                  catalogMergeService.getArticlesForCatalog(catalogId, tenantId),
                  catalogMergeService.getOuvragesForCatalog(catalogId, tenantId),
                ]);
                catalog = {
                  ...catalog,
                  articles: articles || [],
                  ouvrages: ouvrages || [],
                  stats: {
                    totalArticles: articles?.length || 0,
                    totalOuvrages: ouvrages?.length || 0,
                    totalFamilies: catalog.families?.length || 0,
                  },
                };
              } else {
                catalog = await catalogService.findOne(catalogId);
              }
            } catch (error) {
              if (error instanceof NotFoundException) {
                return 'Catalogue non trouvé.';
              }
              throw error;
            }

            if (!catalog) {
              return 'Catalogue non trouvé.';
            }

            if (catalog.tenantId !== tenantId && catalog.tenantId !== null) {
              return 'Catalogue non accessible pour ce tenant.';
            }
            return formatResponseAsJson(catalog);
          }

          // Lister tous les catalogues avec recherche textuelle optionnelle
          let catalogs = await catalogMergeService.getCatalogsWithFamilies(tenantId);
          if (!catalogs || catalogs.length === 0) {
            return 'Aucun catalogue trouvé.';
          }

          // Filtrer par recherche textuelle si fournie
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            catalogs = catalogs.filter(
              (c) =>
                c.name?.toLowerCase().includes(searchLower) ||
                c.description?.toLowerCase().includes(searchLower)
            );
            if (catalogs.length === 0) {
              return `Aucun catalogue trouvé correspondant à "${search}".`;
            }
          }

          // Enrichir chaque catalogue avec des statistiques basiques
          const enrichedCatalogs = await Promise.all(
            catalogs.map(async (catalog) => {
              try {
                const [articles, ouvrages] = await Promise.all([
                  catalogMergeService.getArticlesForCatalog(catalog.catalogId, tenantId).catch(() => []),
                  catalogMergeService.getOuvragesForCatalog(catalog.catalogId, tenantId).catch(() => []),
                ]);
                return {
                  ...catalog,
                  stats: {
                    totalArticles: articles?.length || 0,
                    totalOuvrages: ouvrages?.length || 0,
                    totalFamilies: catalog.families?.length || 0,
                  },
                };
              } catch (error) {
                return {
                  ...catalog,
                  stats: {
                    totalArticles: 0,
                    totalOuvrages: 0,
                    totalFamilies: catalog.families?.length || 0,
                  },
                };
              }
            })
          );

          return formatResponseAsJson(enrichedCatalogs);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les catalogues');
        }
      },
      {
        name: 'search_catalogs',
        description:
          'Rechercher des catalogues par nom ou recherche textuelle. Utilise cet outil quand l\'utilisateur demande des informations sur les catalogues. IMPORTANT: Utilisez catalogName (nom du catalogue) au lieu de catalogId. Quand un catalogue spécifique est recherché par nom, TOUS les éléments associés sont automatiquement inclus (articles, ouvrages, familles avec leurs sous-familles). Pour la liste de tous les catalogues, les statistiques (nombre d\'articles, ouvrages, familles) sont incluses. Supporte la recherche textuelle par nom ou description.',
        schema: {
          type: 'object',
          properties: {
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue à rechercher (ex: "Catalogue principal"). Quand un catalogue spécifique est recherché, TOUS ses éléments (articles, ouvrages, familles) sont automatiquement inclus.',
            },
            catalogId: {
              type: 'string',
              description: 'Identifiant technique d\'un catalogue spécifique (usage interne uniquement, préférez catalogName)',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle par nom ou description de catalogue',
            },
            withDetails: {
              type: 'boolean',
              description: 'Inclure les détails complets du catalogue (articles, ouvrages, familles) - utilisé uniquement avec catalogId',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des articles
    tool(
      async ({ 
        articleName,
        articleCode,
        catalogName,
        familyName,
        search,
        minPrice,
        maxPrice,
        limit: resultLimit
      }: {
        articleName?: string;
        articleCode?: string;
        catalogName?: string;
        familyName?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
      }) => {
        try {
          let articles: any[] = [];

          // Recherche par nom ou code d'article spécifique
          if (articleName || articleCode) {
            try {
              const article = await findArticleByNameOrCode(
                catalogMergeService,
                articleName || articleCode!,
                catalogName ? (await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId)).catalogId : undefined,
                tenantId,
              );
              return formatResponseAsJson(article);
            } catch (error) {
              return `❌ Erreur : Article "${articleName || articleCode}" non trouvé${catalogName ? ` dans le catalogue "${catalogName}"` : ''}.`;
            }
          }

          // Recherche par catalogue
          if (catalogName) {
            const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
            articles = await catalogMergeService.getArticlesForCatalog(catalog.catalogId, tenantId);
            
            // Filtrer par famille si fournie
            if (familyName) {
              try {
                const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
                const familyArticles = await catalogMergeService.getArticlesForFamily(family.familyId, tenantId);
                articles = articles.filter(a => 
                  familyArticles.some(fa => fa.articleId === a.articleId)
                );
              } catch (error) {
                return `❌ Erreur : Famille "${familyName}" non trouvée dans le catalogue "${catalogName}".`;
              }
            }
          } else if (familyName) {
            // Recherche par famille uniquement (nécessite de trouver le catalogue)
            const catalogs = await catalogMergeService.getCatalogsWithFamilies(tenantId);
            for (const catalog of catalogs) {
              try {
                const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
                const familyArticles = await catalogMergeService.getArticlesForFamily(family.familyId, tenantId);
                articles.push(...familyArticles);
              } catch (error) {
                // Famille non trouvée dans ce catalogue, continuer
              }
            }
          } else {
            // Lister tous les articles du tenant
            articles = await catalogMergeService.getArticles(tenantId);
          }

          if (!articles || articles.length === 0) {
            return 'Aucun article trouvé.';
          }

          // Filtrer par recherche textuelle si fournie
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            articles = articles.filter(
              (a) =>
                a.name?.toLowerCase().includes(searchLower) ||
                a.label?.toLowerCase().includes(searchLower) ||
                a.code?.toLowerCase().includes(searchLower) ||
                a.commercialDescription?.toLowerCase().includes(searchLower)
            );
            if (articles.length === 0) {
              return `Aucun article trouvé correspondant à "${search}".`;
            }
          }

          // Filtrer par prix si fourni
          if (minPrice !== undefined && minPrice !== null) {
            articles = articles.filter((a) => (a.sellingPrice || 0) >= minPrice);
          }
          if (maxPrice !== undefined && maxPrice !== null) {
            articles = articles.filter((a) => (a.sellingPrice || 0) <= maxPrice);
          }

          // Limiter les résultats
          const limit = resultLimit && resultLimit > 0 ? Math.min(resultLimit, 200) : 100;
          return formatResponseAsJson(articles.slice(0, limit));
        } catch (error: any) {
          return handleToolError(error, 'récupérer les articles');
        }
      },
      {
        name: 'search_articles',
        description:
          'Rechercher des articles par nom, code, catalogue, famille, prix ou recherche textuelle. Utilise cet outil quand l\'utilisateur demande des informations sur les articles. IMPORTANT: Utilisez articleName, articleCode, catalogName, familyName au lieu d\'IDs. Supporte la recherche flexible par texte (nom, code, label, description), filtres par prix (minPrice, maxPrice), et combinaison de critères (catalogue + famille, famille + recherche, etc.).',
        schema: {
          type: 'object',
          properties: {
            articleName: {
              type: 'string',
              description: 'Nom exact de l\'article à rechercher (ex: "Câble électrique")',
            },
            articleCode: {
              type: 'string',
              description: 'Code exact de l\'article à rechercher (ex: "CAB-001")',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue pour filtrer les articles (ex: "Catalogue principal")',
            },
            familyName: {
              type: 'string',
              description: 'Nom de la famille pour filtrer les articles (ex: "Électricité")',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par nom, code, label ou description commerciale',
            },
            minPrice: {
              type: 'number',
              description: 'Prix de vente minimum en euros (filtre par prix)',
            },
            maxPrice: {
              type: 'number',
              description: 'Prix de vente maximum en euros (filtre par prix)',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats (défaut: 100, maximum: 200)',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des ouvrages
    tool(
      async ({ 
        ouvrageDesignation,
        catalogName,
        familyName,
        search,
        minPrice,
        maxPrice,
        limit: resultLimit
      }: {
        ouvrageDesignation?: string;
        catalogName?: string;
        familyName?: string;
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        limit?: number;
      }) => {
        try {
          let ouvrages: any[] = [];

          // Recherche par désignation d'ouvrage spécifique
          if (ouvrageDesignation) {
            if (!catalogName) {
              return '❌ Erreur : catalogName est requis pour rechercher un ouvrage par désignation.';
            }
            try {
              const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
              const ouvrage = await findOuvrageByDesignation(catalogMergeService, ouvrageDesignation, catalog.catalogId, tenantId);
              return formatResponseAsJson(ouvrage);
            } catch (error) {
              return `❌ Erreur : Ouvrage "${ouvrageDesignation}" non trouvé dans le catalogue "${catalogName}".`;
            }
          }

          // Recherche par catalogue
          if (catalogName) {
            const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
            ouvrages = await catalogMergeService.getOuvragesForCatalog(catalog.catalogId, tenantId);
            
            // Filtrer par famille si fournie
            if (familyName) {
              try {
                const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
                const familyOuvrages = await catalogMergeService.getOuvragesForFamily(family.familyId, tenantId);
                ouvrages = ouvrages.filter(o => 
                  familyOuvrages.some(fo => fo.ouvrageId === o.ouvrageId)
                );
              } catch (error) {
                return `❌ Erreur : Famille "${familyName}" non trouvée dans le catalogue "${catalogName}".`;
              }
            }
          } else if (familyName) {
            // Recherche par famille uniquement (nécessite de trouver le catalogue)
            const catalogs = await catalogMergeService.getCatalogsWithFamilies(tenantId);
            for (const catalog of catalogs) {
              try {
                const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
                const familyOuvrages = await catalogMergeService.getOuvragesForFamily(family.familyId, tenantId);
                ouvrages.push(...familyOuvrages);
              } catch (error) {
                // Famille non trouvée dans ce catalogue, continuer
              }
            }
          } else {
            return '❌ Erreur : Veuillez fournir au moins catalogName, familyName ou ouvrageDesignation avec catalogName.';
          }

          if (!ouvrages || ouvrages.length === 0) {
            return 'Aucun ouvrage trouvé.';
          }

          // Filtrer par recherche textuelle si fournie
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            ouvrages = ouvrages.filter(
              (o) => o.designation?.toLowerCase().includes(searchLower)
            );
            if (ouvrages.length === 0) {
              return `Aucun ouvrage trouvé correspondant à "${search}".`;
            }
          }

          // Filtrer par prix si fourni
          if (minPrice !== undefined && minPrice !== null) {
            ouvrages = ouvrages.filter((o) => (o.prix || 0) >= minPrice);
          }
          if (maxPrice !== undefined && maxPrice !== null) {
            ouvrages = ouvrages.filter((o) => (o.prix || 0) <= maxPrice);
          }

          // Limiter les résultats
          const limit = resultLimit && resultLimit > 0 ? Math.min(resultLimit, 200) : 100;
          return formatResponseAsJson(ouvrages.slice(0, limit));
        } catch (error: any) {
          return handleToolError(error, 'récupérer les ouvrages');
        }
      },
      {
        name: 'search_ouvrages',
        description:
          'Rechercher des ouvrages par désignation, catalogue, famille, prix ou recherche textuelle. Utilise cet outil quand l\'utilisateur demande des informations sur les ouvrages. IMPORTANT: Utilisez ouvrageDesignation, catalogName, familyName au lieu d\'IDs. Supporte la recherche flexible par texte (désignation), filtres par prix (minPrice, maxPrice), et combinaison de critères (catalogue + famille, famille + recherche, etc.).',
        schema: {
          type: 'object',
          properties: {
            ouvrageDesignation: {
              type: 'string',
              description: 'Désignation exacte de l\'ouvrage à rechercher (ex: "Installation électrique complète"). Nécessite catalogName.',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue pour filtrer les ouvrages (ex: "Catalogue principal")',
            },
            familyName: {
              type: 'string',
              description: 'Nom de la famille pour filtrer les ouvrages (ex: "Électricité")',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par désignation',
            },
            minPrice: {
              type: 'number',
              description: 'Prix minimum en euros (filtre par prix)',
            },
            maxPrice: {
              type: 'number',
              description: 'Prix maximum en euros (filtre par prix)',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats (défaut: 100, maximum: 200)',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des familles
    tool(
      async ({ 
        familyName,
        catalogName,
        parentFamilyName,
        search,
        includeSubFamilies
      }: {
        familyName?: string;
        catalogName?: string;
        parentFamilyName?: string;
        search?: string;
        includeSubFamilies?: boolean;
      }) => {
        try {
          // Recherche d'une famille spécifique par nom
          if (familyName) {
            if (!catalogName) {
              return '❌ Erreur : catalogName est requis pour rechercher une famille par nom.';
            }
            try {
              const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
              const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
              
              let result: any = { family };
              if (includeSubFamilies) {
                const subFamilies = await catalogMergeService.getSubFamilies(family.familyId, tenantId);
                result.subFamilies = subFamilies || [];
              }
              return formatResponseAsJson(result);
            } catch (error) {
              return `❌ Erreur : Famille "${familyName}" non trouvée dans le catalogue "${catalogName}".`;
            }
          }

          // Recherche par catalogue
          if (catalogName) {
            const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
            let families = await catalogMergeService.getParentFamiliesForCatalog(catalog.catalogId, tenantId);
            
            // Filtrer par famille parente si fournie
            if (parentFamilyName) {
              try {
                const parentFamily = await findFamilyByName(catalogMergeService, parentFamilyName, catalog.catalogId, tenantId);
                families = families.filter(f => f.parentId === parentFamily.familyId);
              } catch (error) {
                return `❌ Erreur : Famille parente "${parentFamilyName}" non trouvée dans le catalogue "${catalogName}".`;
              }
            }

            // Filtrer par recherche textuelle si fournie
            if (search && search.trim().length > 0) {
              const searchLower = search.trim().toLowerCase();
              families = families.filter(f => f.name?.toLowerCase().includes(searchLower));
              if (families.length === 0) {
                return `Aucune famille trouvée correspondant à "${search}" dans le catalogue "${catalogName}".`;
              }
            }

            if (!families || families.length === 0) {
              return 'Aucune famille trouvée pour ce catalogue.';
            }
            return formatResponseAsJson(families);
          }

          return '❌ Erreur : Veuillez fournir au moins catalogName ou familyName avec catalogName.';
        } catch (error: any) {
          return handleToolError(error, 'récupérer les familles');
        }
      },
      {
        name: 'search_families',
        description:
          'Rechercher des familles par nom, catalogue, famille parente ou recherche textuelle. Utilise cet outil quand l\'utilisateur demande des informations sur les familles. IMPORTANT: Utilisez familyName, catalogName, parentFamilyName au lieu d\'IDs. Supporte la recherche flexible par texte (nom), filtres par famille parente, et récupération des sous-familles.',
        schema: {
          type: 'object',
          properties: {
            familyName: {
              type: 'string',
              description: 'Nom exact de la famille à rechercher (ex: "Électricité"). Nécessite catalogName.',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue pour filtrer les familles (ex: "Catalogue principal")',
            },
            parentFamilyName: {
              type: 'string',
              description: 'Nom de la famille parente pour filtrer les sous-familles (ex: "Électricité")',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par nom de famille',
            },
            includeSubFamilies: {
              type: 'boolean',
              description: 'Inclure les sous-familles lors de la recherche d\'une famille spécifique (défaut: false)',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des sociétés
    tool(
      async ({ companyName, search }: { 
        companyName?: string;
        search?: string;
      }) => {
        try {
          // Recherche par nom de société
          if (companyName) {
            try {
              const company = await findCompanyByName(companyService, companyName, userId, tenantId);
              return formatResponseAsJson(company);
            } catch (error) {
              return `❌ Erreur : Société "${companyName}" non trouvée.`;
            }
          }

          // Lister toutes les sociétés de l'utilisateur
          const companies = await companyService.findUserCompanies(userId);
          if (!companies || !Array.isArray(companies) || companies.length === 0) {
            return 'Aucune société trouvée pour cet utilisateur.';
          }

          // Filtrer par recherche textuelle si fournie
          let filteredCompanies = companies.filter((c: any) => c.idTenant === tenantId);
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            filteredCompanies = filteredCompanies.filter(
              (c: any) =>
                c.name?.toLowerCase().includes(searchLower) ||
                c.entityName?.toLowerCase().includes(searchLower)
            );
            if (filteredCompanies.length === 0) {
              return `Aucune société trouvée correspondant à "${search}".`;
            }
          }

          return formatResponseAsJson(filteredCompanies);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les sociétés');
        }
      },
      {
        name: 'search_companies',
        description:
          'Rechercher des sociétés par nom ou recherche textuelle. Utilise cet outil quand l\'utilisateur demande des informations sur les sociétés. IMPORTANT: Utilisez companyName au lieu d\'userId. Supporte la recherche flexible par texte (nom, raison sociale).',
        schema: {
          type: 'object',
          properties: {
            companyName: {
              type: 'string',
              description: 'Nom exact de la société à rechercher (ex: "ABC Construction")',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par nom ou raison sociale',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des devis
    tool(
      async ({ 
        documentCode,
        customerName,
        companyName,
        search, 
        stateCode,
        createdAtFrom,
        createdAtTo,
        updatedAtFrom,
        updatedAtTo,
        minAmount,
        maxAmount,
        limit: resultLimit
      }: {
        documentCode?: string;
        customerName?: string;
        companyName?: string;
        search?: string;
        stateCode?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        updatedAtFrom?: string;
        updatedAtTo?: string;
        minAmount?: number;
        maxAmount?: number;
        limit?: number;
      }) => {
        try {
          // Récupérer tous les devis du tenant (limité pour performance)
          const result = await documentService.findAll(tenantId, 1, 200);
          let devis = result.documents.filter(
            (doc) => doc.type?.code === DOCUMENT_TYPE.DEVIS
          );
          
          // Recherche par code de document
          if (documentCode) {
            devis = devis.filter((doc) => doc.code?.toLowerCase().trim() === documentCode.toLowerCase().trim());
            if (devis.length === 0) {
              return `Aucun devis trouvé avec le code "${documentCode}".`;
            }
            return formatResponseAsJson(devis[0]);
          }
          
          // Filtrer par client si fourni (par nom)
          if (customerName) {
            const customers = await customerService.findWithFilters(tenantId, {
              search: customerName.trim(),
              limit: 10,
            });
            if (!customers || customers.length === 0) {
              return `Aucun client trouvé correspondant à "${customerName}".`;
            }
            if (customers.length > 1) {
              const customerList = customers.slice(0, 5).map((c: any) => {
                const name = c.individual?.firstname && c.individual?.lastname
                  ? `${c.individual.firstname} ${c.individual.lastname}`
                  : c.professional?.raisonSociale || c.publicEntity?.name || c.code;
                return name;
              }).join(', ');
              return `⚠️ Attention : Plusieurs clients correspondent à "${customerName}". Veuillez être plus précis. Clients trouvés : ${customerList}.`;
            }
            const customer = customers[0];
            devis = devis.filter((doc) => doc.idCustomer === customer.id);
            if (devis.length === 0) {
              return `Aucun devis trouvé pour le client "${customerName}".`;
            }
          }
          
          // Filtrer par société si fourni (par nom)
          if (companyName) {
            try {
              const company = await findCompanyByName(companyService, companyName, userId, tenantId);
              devis = devis.filter((doc) => doc.idCompany === company.id);
              if (devis.length === 0) {
                return `Aucun devis trouvé pour la société "${companyName}".`;
              }
            } catch (error) {
              return `❌ Erreur : Société "${companyName}" non trouvée.`;
            }
          }
          
          // Filtrer par état si fourni
          if (stateCode) {
            devis = devis.filter((doc) => doc.state?.code === stateCode);
          }
          
          // Recherche textuelle par titre, description ou code
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            devis = devis.filter(
              (doc) =>
                doc.title?.toLowerCase().includes(searchLower) ||
                doc.description?.toLowerCase().includes(searchLower) ||
                doc.code?.toLowerCase().includes(searchLower)
            );
            if (devis.length === 0) {
              return `Aucun devis trouvé correspondant à "${search}".`;
            }
          }

          // Filtrer par date de création
          if (createdAtFrom) {
            const fromDate = new Date(createdAtFrom);
            devis = devis.filter((doc) => {
              const docDate = new Date(doc.createdAt);
              return docDate >= fromDate;
            });
          }
          if (createdAtTo) {
            const toDate = new Date(createdAtTo);
            toDate.setHours(23, 59, 59, 999);
            devis = devis.filter((doc) => {
              const docDate = new Date(doc.createdAt);
              return docDate <= toDate;
            });
          }

          // Filtrer par date de mise à jour
          if (updatedAtFrom) {
            const fromDate = new Date(updatedAtFrom);
            devis = devis.filter((doc) => {
              const docDate = new Date(doc.updatedAt);
              return docDate >= fromDate;
            });
          }
          if (updatedAtTo) {
            const toDate = new Date(updatedAtTo);
            toDate.setHours(23, 59, 59, 999);
            devis = devis.filter((doc) => {
              const docDate = new Date(doc.updatedAt);
              return docDate <= toDate;
            });
          }

          // Filtrer par montant
          if (minAmount !== undefined && minAmount !== null) {
            devis = devis.filter((doc) => {
              const amount = doc.totalTTC || doc.totalHT || 0;
              return amount >= minAmount;
            });
          }
          if (maxAmount !== undefined && maxAmount !== null) {
            devis = devis.filter((doc) => {
              const amount = doc.totalTTC || doc.totalHT || 0;
              return amount <= maxAmount;
            });
          }
          
          if (devis.length === 0) {
            return 'Aucun devis trouvé avec les critères spécifiés.';
          }
          
          // Limiter les résultats
          const limit = resultLimit && resultLimit > 0 ? Math.min(resultLimit, 200) : 100;
          return formatResponseAsJson(devis.slice(0, limit));
        } catch (error: any) {
          return handleToolError(error, 'récupérer les devis');
        }
      },
      {
        name: 'search_devis',
        description:
          'Rechercher des devis par différents critères avancés (code, client, société, état, dates, montants, recherche textuelle) ou lister tous les devis. Utilise cet outil quand l\'utilisateur demande des informations sur les devis avec des filtres spécifiques. IMPORTANT: Utilisez documentCode, customerName, companyName au lieu d\'IDs. Supporte la recherche flexible par texte (titre, description, code), filtres par dates (création, mise à jour), filtres par montants (min/max), et filtres par statut. Les résultats sont formatés de manière lisible avec les montants, statuts et informations clients.',
        schema: {
          type: 'object',
          properties: {
            documentCode: {
              type: 'string',
              description: 'Code exact du devis à rechercher (ex: "DEV-2024-001")',
            },
            customerName: {
              type: 'string',
              description: 'Nom du client pour filtrer les devis (ex: "Jean Dupont")',
            },
            companyName: {
              type: 'string',
              description: 'Nom de la société pour filtrer les devis (ex: "ABC Construction")',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par titre, description ou code du devis',
            },
            stateCode: {
              type: 'string',
              description: 'Code de l\'état du devis (DRAFT, PENDING_RESPONSE, SIGNED, DECLINED)',
            },
            createdAtFrom: {
              type: 'string',
              description: 'Date de création minimale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-01-01"',
            },
            createdAtTo: {
              type: 'string',
              description: 'Date de création maximale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-12-31"',
            },
            updatedAtFrom: {
              type: 'string',
              description: 'Date de mise à jour minimale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-01-01"',
            },
            updatedAtTo: {
              type: 'string',
              description: 'Date de mise à jour maximale (format ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss). Exemple: "2024-12-31"',
            },
            minAmount: {
              type: 'number',
              description: 'Montant minimum TTC en euros. Exemple: 100 pour filtrer les devis de 100€ et plus',
            },
            maxAmount: {
              type: 'number',
              description: 'Montant maximum TTC en euros. Exemple: 1000 pour filtrer les devis de 1000€ et moins',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats à retourner (défaut: 100, maximum: 200)',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des commandes
    tool(
      async ({ 
        documentCode,
        customerName,
        companyName,
        search,
        stateCode,
        createdAtFrom,
        createdAtTo,
        minAmount,
        maxAmount,
        limit: resultLimit
      }: {
        documentCode?: string;
        customerName?: string;
        companyName?: string;
        search?: string;
        stateCode?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        minAmount?: number;
        maxAmount?: number;
        limit?: number;
      }) => {
        try {
          // Récupérer toutes les commandes du tenant
          const result = await documentService.findAll(tenantId, 1, 200);
          let commandes = result.documents.filter(
            (doc) => doc.type?.code === DOCUMENT_TYPE.COMMANDE
          );
          
          // Recherche par code de document
          if (documentCode) {
            commandes = commandes.filter((doc) => doc.code?.toLowerCase().trim() === documentCode.toLowerCase().trim());
            if (commandes.length === 0) {
              return `Aucune commande trouvée avec le code "${documentCode}".`;
            }
            return formatResponseAsJson(commandes[0]);
          }
          
          // Filtrer par client si fourni (par nom)
          if (customerName) {
            const customers = await customerService.findWithFilters(tenantId, {
              search: customerName.trim(),
              limit: 10,
            });
            if (!customers || customers.length === 0) {
              return `Aucun client trouvé correspondant à "${customerName}".`;
            }
            if (customers.length > 1) {
              const customerList = customers.slice(0, 5).map((c: any) => {
                const name = c.individual?.firstname && c.individual?.lastname
                  ? `${c.individual.firstname} ${c.individual.lastname}`
                  : c.professional?.raisonSociale || c.publicEntity?.name || c.code;
                return name;
              }).join(', ');
              return `⚠️ Attention : Plusieurs clients correspondent à "${customerName}". Veuillez être plus précis. Clients trouvés : ${customerList}.`;
            }
            const customer = customers[0];
            commandes = commandes.filter((doc) => doc.idCustomer === customer.id);
            if (commandes.length === 0) {
              return `Aucune commande trouvée pour le client "${customerName}".`;
            }
          }
          
          // Filtrer par société si fourni (par nom)
          if (companyName) {
            try {
              const company = await findCompanyByName(companyService, companyName, userId, tenantId);
              commandes = commandes.filter((doc) => doc.idCompany === company.id);
              if (commandes.length === 0) {
                return `Aucune commande trouvée pour la société "${companyName}".`;
              }
            } catch (error) {
              return `❌ Erreur : Société "${companyName}" non trouvée.`;
            }
          }
          
          // Filtrer par état si fourni
          if (stateCode) {
            commandes = commandes.filter((doc) => doc.state?.code === stateCode);
          }
          
          // Recherche textuelle par titre, description ou code
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            commandes = commandes.filter(
              (doc) =>
                doc.title?.toLowerCase().includes(searchLower) ||
                doc.description?.toLowerCase().includes(searchLower) ||
                doc.code?.toLowerCase().includes(searchLower)
            );
            if (commandes.length === 0) {
              return `Aucune commande trouvée correspondant à "${search}".`;
            }
          }

          // Filtrer par date de création
          if (createdAtFrom) {
            const fromDate = new Date(createdAtFrom);
            commandes = commandes.filter((doc) => {
              const docDate = new Date(doc.createdAt);
              return docDate >= fromDate;
            });
          }
          if (createdAtTo) {
            const toDate = new Date(createdAtTo);
            toDate.setHours(23, 59, 59, 999);
            commandes = commandes.filter((doc) => {
              const docDate = new Date(doc.createdAt);
              return docDate <= toDate;
            });
          }

          // Filtrer par montant
          if (minAmount !== undefined && minAmount !== null) {
            commandes = commandes.filter((doc) => {
              const amount = doc.totalTTC || doc.totalHT || 0;
              return amount >= minAmount;
            });
          }
          if (maxAmount !== undefined && maxAmount !== null) {
            commandes = commandes.filter((doc) => {
              const amount = doc.totalTTC || doc.totalHT || 0;
              return amount <= maxAmount;
            });
          }
          
          if (commandes.length === 0) {
            return 'Aucune commande trouvée avec les critères spécifiés.';
          }
          
          // Limiter les résultats
          const limit = resultLimit && resultLimit > 0 ? Math.min(resultLimit, 200) : 100;
          return formatResponseAsJson(commandes.slice(0, limit));
        } catch (error: any) {
          return handleToolError(error, 'récupérer les commandes');
        }
      },
      {
        name: 'search_commandes',
        description:
          'Rechercher des commandes par différents critères avancés (code, client, société, état, dates, montants, recherche textuelle) ou lister toutes les commandes. Utilise cet outil quand l\'utilisateur demande des informations sur les commandes. IMPORTANT: Utilisez documentCode, customerName, companyName au lieu d\'IDs. Supporte la recherche flexible par texte (titre, description, code), filtres par dates, filtres par montants, et filtres par statut.',
        schema: {
          type: 'object',
          properties: {
            documentCode: {
              type: 'string',
              description: 'Code exact de la commande à rechercher (ex: "CMD-2024-001")',
            },
            customerName: {
              type: 'string',
              description: 'Nom du client pour filtrer les commandes (ex: "Jean Dupont")',
            },
            companyName: {
              type: 'string',
              description: 'Nom de la société pour filtrer les commandes (ex: "ABC Construction")',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par titre, description ou code de la commande',
            },
            stateCode: {
              type: 'string',
              description: 'Code de l\'état de la commande (IN_PROGRESS, COMPLETED, CANCELLED)',
            },
            createdAtFrom: {
              type: 'string',
              description: 'Date de création minimale (format ISO: YYYY-MM-DD)',
            },
            createdAtTo: {
              type: 'string',
              description: 'Date de création maximale (format ISO: YYYY-MM-DD)',
            },
            minAmount: {
              type: 'number',
              description: 'Montant minimum TTC en euros',
            },
            maxAmount: {
              type: 'number',
              description: 'Montant maximum TTC en euros',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats (défaut: 100, maximum: 200)',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des factures
    tool(
      async ({ 
        documentCode,
        customerName,
        companyName,
        includeAcompte,
        search,
        stateCode,
        createdAtFrom,
        createdAtTo,
        minAmount,
        maxAmount,
        limit: resultLimit
      }: {
        documentCode?: string;
        customerName?: string;
        companyName?: string;
        includeAcompte?: boolean;
        search?: string;
        stateCode?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        minAmount?: number;
        maxAmount?: number;
        limit?: number;
      }) => {
        try {
          // Récupérer toutes les factures du tenant
          const result = await documentService.findAll(tenantId, 1, 200);
          let factures = result.documents.filter(
            (doc) => doc.type?.code === DOCUMENT_TYPE.FACTURE || 
                     doc.type?.code === DOCUMENT_TYPE.FACTURE_ACOMPTE
          );
          
          // Recherche par code de document
          if (documentCode) {
            factures = factures.filter((doc) => doc.code?.toLowerCase().trim() === documentCode.toLowerCase().trim());
            if (factures.length === 0) {
              return `Aucune facture trouvée avec le code "${documentCode}".`;
            }
            return formatResponseAsJson(factures[0]);
          }
          
          // Filtrer pour exclure les factures d'acompte si demandé
          let filteredFactures = factures;
          if (includeAcompte === false) {
            filteredFactures = factures.filter(
              (doc) => doc.type?.code === DOCUMENT_TYPE.FACTURE
            );
          }

          // Filtrer par état si fourni
          if (stateCode) {
            filteredFactures = filteredFactures.filter((doc) => doc.state?.code === stateCode);
          }
          
          // Filtrer par client si fourni (par nom)
          if (customerName) {
            const customers = await customerService.findWithFilters(tenantId, {
              search: customerName.trim(),
              limit: 10,
            });
            if (!customers || customers.length === 0) {
              return `Aucun client trouvé correspondant à "${customerName}".`;
            }
            if (customers.length > 1) {
              const customerList = customers.slice(0, 5).map((c: any) => {
                const name = c.individual?.firstname && c.individual?.lastname
                  ? `${c.individual.firstname} ${c.individual.lastname}`
                  : c.professional?.raisonSociale || c.publicEntity?.name || c.code;
                return name;
              }).join(', ');
              return `⚠️ Attention : Plusieurs clients correspondent à "${customerName}". Veuillez être plus précis. Clients trouvés : ${customerList}.`;
            }
            const customer = customers[0];
            filteredFactures = filteredFactures.filter((doc) => doc.idCustomer === customer.id);
            if (filteredFactures.length === 0) {
              return `Aucune facture trouvée pour le client "${customerName}".`;
            }
          }
          
          // Filtrer par société si fourni (par nom)
          if (companyName) {
            try {
              const company = await findCompanyByName(companyService, companyName, userId, tenantId);
              filteredFactures = filteredFactures.filter((doc) => doc.idCompany === company.id);
              if (filteredFactures.length === 0) {
                return `Aucune facture trouvée pour la société "${companyName}".`;
              }
            } catch (error) {
              return `❌ Erreur : Société "${companyName}" non trouvée.`;
            }
          }
          
          // Recherche textuelle par titre, description ou code
          if (search && search.trim().length > 0) {
            const searchLower = search.trim().toLowerCase();
            filteredFactures = filteredFactures.filter(
              (doc) =>
                doc.title?.toLowerCase().includes(searchLower) ||
                doc.description?.toLowerCase().includes(searchLower) ||
                doc.code?.toLowerCase().includes(searchLower)
            );
            if (filteredFactures.length === 0) {
              return `Aucune facture trouvée correspondant à "${search}".`;
            }
          }

          // Filtrer par date de création
          if (createdAtFrom) {
            const fromDate = new Date(createdAtFrom);
            filteredFactures = filteredFactures.filter((doc) => {
              const docDate = new Date(doc.createdAt);
              return docDate >= fromDate;
            });
          }
          if (createdAtTo) {
            const toDate = new Date(createdAtTo);
            toDate.setHours(23, 59, 59, 999);
            filteredFactures = filteredFactures.filter((doc) => {
              const docDate = new Date(doc.createdAt);
              return docDate <= toDate;
            });
          }

          // Filtrer par montant
          if (minAmount !== undefined && minAmount !== null) {
            filteredFactures = filteredFactures.filter((doc) => {
              const amount = doc.totalTTC || doc.totalHT || 0;
              return amount >= minAmount;
            });
          }
          if (maxAmount !== undefined && maxAmount !== null) {
            filteredFactures = filteredFactures.filter((doc) => {
              const amount = doc.totalTTC || doc.totalHT || 0;
              return amount <= maxAmount;
            });
          }
          
          if (filteredFactures.length === 0) {
            return 'Aucune facture trouvée avec les critères spécifiés.';
          }
          
          // Limiter les résultats
          const limit = resultLimit && resultLimit > 0 ? Math.min(resultLimit, 200) : 100;
          return formatResponseAsJson(filteredFactures.slice(0, limit));
        } catch (error: any) {
          return handleToolError(error, 'récupérer les factures');
        }
      },
      {
        name: 'search_factures',
        description:
          'Rechercher des factures par différents critères avancés (code, client, société, état, dates, montants, recherche textuelle) ou lister toutes les factures. Utilise cet outil quand l\'utilisateur demande des informations sur les factures. IMPORTANT: Utilisez documentCode, customerName, companyName au lieu d\'IDs. Supporte la recherche flexible par texte (titre, description, code), filtres par dates, filtres par montants, filtres par statut, et inclusion/exclusion des factures d\'acompte.',
        schema: {
          type: 'object',
          properties: {
            documentCode: {
              type: 'string',
              description: 'Code exact de la facture à rechercher (ex: "FAC-2024-001")',
            },
            customerName: {
              type: 'string',
              description: 'Nom du client pour filtrer les factures (ex: "Jean Dupont")',
            },
            companyName: {
              type: 'string',
              description: 'Nom de la société pour filtrer les factures (ex: "ABC Construction")',
            },
            includeAcompte: {
              type: 'boolean',
              description: 'Inclure les factures d\'acompte (true par défaut). Mettre à false pour exclure les factures d\'acompte.',
            },
            search: {
              type: 'string',
              description: 'Recherche textuelle flexible par titre, description ou code de la facture',
            },
            stateCode: {
              type: 'string',
              description: 'Code de l\'état de la facture (PAID, UNPAID, PARTIALLY_PAID)',
            },
            createdAtFrom: {
              type: 'string',
              description: 'Date de création minimale (format ISO: YYYY-MM-DD)',
            },
            createdAtTo: {
              type: 'string',
              description: 'Date de création maximale (format ISO: YYYY-MM-DD)',
            },
            minAmount: {
              type: 'number',
              description: 'Montant minimum TTC en euros',
            },
            maxAmount: {
              type: 'number',
              description: 'Montant maximum TTC en euros',
            },
            limit: {
              type: 'number',
              description: 'Nombre maximum de résultats (défaut: 100, maximum: 200)',
            },
          },
        },
      },
    ),

    // Outil pour rechercher des utilisateurs
    tool(
      async ({ userId, email }: {
        userId?: string;
        email?: string;
      }) => {
        try {
          // Recherche par email
          if (email) {
            if (!email || email.trim().length === 0) {
              return 'Email invalide.';
            }
            const user = await userService.findOneByEmail(email.trim());
            if (!user) {
              return 'Utilisateur non trouvé avec cet email.';
            }
            // Filtrer par tenantId
            if (user.idTenant !== tenantId) {
              return 'Utilisateur non accessible pour ce tenant.';
            }
            return formatResponseAsJson(user);
          }

          // Recherche par ID utilisateur
          if (userId) {
            if (!userId || userId.trim().length === 0) {
              return 'Identifiant d\'utilisateur invalide.';
            }
            const user = await userService.findOneById(userId);
            if (!user) {
              return 'Utilisateur non trouvé.';
            }
            // Filtrer par tenantId
            if (user.idTenant !== tenantId) {
              return 'Utilisateur non accessible pour ce tenant.';
            }
            return formatResponseAsJson(user);
          }

          // Lister tous les utilisateurs du tenant
          const users = await userService.findAllByTenant(tenantId);
          if (!users || users.length === 0) {
            return 'Aucun utilisateur trouvé pour ce tenant.';
          }
          return formatResponseAsJson(users);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les utilisateurs');
        }
      },
      {
        name: 'search_users',
        description:
          'Rechercher des utilisateurs par email, ID ou lister tous les utilisateurs du tenant. Utilise cet outil quand l\'utilisateur demande des informations sur les utilisateurs. Les résultats incluent le nom, email, téléphone, statut admin et les sociétés associées.',
        schema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'Identifiant technique d\'un utilisateur spécifique (usage interne uniquement)',
            },
            email: {
              type: 'string',
              description: 'Email de l\'utilisateur à rechercher',
            },
          },
        },
      },
    ),

    // Outil pour créer un devis avec filtres avancés
    tool(
      async ({
        customerId,
        customerName,
        companyId,
        title,
        description,
        items,
        validityDays,
        customerReference,
        tvaRateId,
        conditionRegulationId,
        workAddressId,
      }: {
        customerId?: string;
        customerName?: string;
        companyId?: string;
        title?: string;
        description?: string;
        items?: Array<{
          type: 'ARTICLE' | 'OUVRAGE';
          componentId?: string;
          componentRef?: string;
          componentName?: string;
          quantity: number;
          unitPriceHT?: number;
          tvaRateId?: string;
        }>;
        validityDays?: number;
        customerReference?: string;
        tvaRateId?: string;
        conditionRegulationId?: string;
        workAddressId?: string;
      }) => {
        try {
          // Validation des paramètres de base
          if (!customerId && !customerName) {
            return '❌ Erreur : Vous devez fournir soit un ID client (customerId) soit un nom de client (customerName).';
          }

          if (!items || items.length === 0) {
            return '❌ Erreur : Vous devez fournir au moins un article ou ouvrage pour le devis.';
          }

          if (items.length > 50) {
            return '❌ Erreur : Maximum 50 items par devis. Veuillez réduire le nombre d\'items.';
          }

          // 1. Résoudre le client
          let customer: any;
          if (customerId) {
            try {
              customer = await customerService.findOne(customerId);
            } catch (error) {
              if (error instanceof NotFoundException) {
                return `❌ Erreur : Client non trouvé avec l'ID "${customerId}".`;
              }
              throw error;
            }
          } else if (customerName) {
            const customers = await customerService.findWithFilters(tenantId, {
              search: customerName.trim(),
              limit: 10,
            });

            if (!customers || customers.length === 0) {
              return `❌ Erreur : Aucun client trouvé correspondant à "${customerName}".`;
            }
            if (customers.length > 1) {
              const customerList = customers
                .slice(0, 5)
                .map((c: any) => {
                  const name =
                    c.individual?.firstname && c.individual?.lastname
                      ? `${c.individual.firstname} ${c.individual.lastname}`
                      : c.professional?.raisonSociale || c.publicEntity?.name || c.code;
                  return name;
                })
                .join(', ');
              return `⚠️ Attention : Plusieurs clients correspondent à "${customerName}". Veuillez être plus précis. Clients trouvés : ${customerList}.`;
            }
            customer = customers[0];
          }

          // Vérifier que le client appartient au tenant
          if (customer.directory?.idTenant !== tenantId) {
            return '❌ Erreur : Client non accessible pour ce tenant.';
          }

          // 2. Récupérer l'adresse de facturation
          let addresses;
          try {
            addresses = await customerService.getCustomerAddresses(customer.id);
          } catch (error) {
            return `❌ Erreur : Impossible de récupérer les adresses du client. ${error?.message || ''}`;
          }

          if (!addresses || !addresses.billingAddress) {
            const customerDisplayName = customer.individual?.firstname && customer.individual?.lastname
              ? `${customer.individual.firstname} ${customer.individual.lastname}`
              : customer.professional?.raisonSociale || customer.publicEntity?.name || customer.code;
            return `❌ Erreur : Le client "${customerDisplayName}" n'a pas d'adresse de facturation. Veuillez ajouter une adresse de facturation au client avant de créer un devis.`;
          }

          // 3. Récupérer le type de document DEVIS
          let documentType: any;
          try {
            documentType = await documentTypeService.getDocumentType(null, DOCUMENT_TYPE.DEVIS);
          } catch (error) {
            return `❌ Erreur système : Impossible de récupérer le type de document DEVIS. ${error?.message || 'Contactez l\'administrateur.'}`;
          }

          if (!documentType) {
            return '❌ Erreur système : Type de document DEVIS non configuré. Contactez l\'administrateur.';
          }

          // 4. Récupérer le taux TVA
          let tvaRate: any;
          if (tvaRateId) {
            try {
              tvaRate = await tvaRateService.findOne(tvaRateId);
            } catch (error) {
              return `❌ Erreur : Taux de TVA non trouvé avec l'ID "${tvaRateId}".`;
            }
          } else {
            // Utiliser le taux par défaut (20% ou premier disponible)
            const tvaRates = await tvaRateService.findAll();
            tvaRate = tvaRates?.find((rate) => rate.rate === 20) || tvaRates?.[0];
            if (!tvaRate) {
              return '❌ Erreur système : Aucun taux de TVA configuré. Veuillez configurer au moins un taux de TVA (par exemple 20%).';
            }
          }

          // 5. Récupérer la société
          let companyIdToUse = companyId;
          if (!companyIdToUse) {
            try {
              const companies = await companyService.findUserCompanies(userId);
              const tenantCompanies = companies?.filter((c: any) => c.idTenant === tenantId);
              if (tenantCompanies && tenantCompanies.length > 0) {
                companyIdToUse = tenantCompanies[0].id;
              } else {
                return '❌ Erreur : Aucune société trouvée pour votre compte. Veuillez créer une société ou contacter l\'administrateur.';
              }
            } catch (error) {
              return `❌ Erreur : Impossible de récupérer les sociétés. ${error?.message || 'Contactez l\'administrateur.'}`;
            }
          }

          // 6. Préparer les items et components
          const resolvedItems: any[] = [];
          const resolvedComponents: any[] = [];
          let position = 0;
          let totalHT = 0;

          for (const item of items) {
            if (!item.quantity || item.quantity <= 0) {
              continue;
            }

            // Utiliser le prix fourni ou 0 par défaut
            const unitPriceHT = item.unitPriceHT || 0;
            const itemTotalHT = unitPriceHT * item.quantity;
            const itemTotalTVA = itemTotalHT * (tvaRate.rate / 100);
            const itemTotalTTC = itemTotalHT + itemTotalTVA;

            totalHT += itemTotalHT;

            // Créer le component
            const componentDto = {
              idComponent: item.componentId || '',
              refComponent: item.componentRef || item.componentName || '',
              type: item.type,
              quantity: item.quantity,
              unitPriceHT: unitPriceHT,
              unitPriceTTC: unitPriceHT * (1 + tvaRate.rate / 100),
              totalHT: itemTotalHT,
              totalTVA: itemTotalTVA,
              totalTTC: itemTotalTTC,
              purchasePriceHT: 0,
              purchasePriceTTC: 0,
            };

            resolvedComponents.push(componentDto);

            // Créer l'item
            const itemDto = {
              idComponent: item.componentId || '',
              refComponent: item.componentRef || item.componentName || '',
              idTvaRate: item.tvaRateId || tvaRate.id,
              position: position++,
              type: item.type,
              quantity: item.quantity,
              totalHT: itemTotalHT,
              totalTVA: itemTotalTVA,
              totalTTC: itemTotalTTC,
            };

            resolvedItems.push(itemDto);
          }

          if (resolvedItems.length === 0) {
            return '❌ Erreur : Aucun item valide n\'a pu être ajouté au devis.';
          }

          // 7. Calculer les totaux finaux
          const totalTVA = totalHT * (tvaRate.rate / 100);
          const totalTTC = totalHT + totalTVA;

          // 8. Calculer la date de validité
          const validityDate = new Date();
          validityDate.setDate(validityDate.getDate() + (validityDays || 30));

          // 9. Créer le document
          const createDocumentDto: any = {
            idCompany: companyIdToUse,
            idType: documentType.id,
            codeType: DOCUMENT_TYPE.DEVIS,
            idCustomer: customer.id,
            idBillingAddress: addresses.billingAddress.id,
            idTvaRate: tvaRate.id,
            idConditionRegulation: conditionRegulationId || customer.idConditionRegulation || undefined,
            idWorkAddress: workAddressId || undefined,
            title: title || `Devis pour ${customer.individual?.firstname && customer.individual?.lastname ? `${customer.individual.firstname} ${customer.individual.lastname}` : customer.professional?.raisonSociale || customer.publicEntity?.name || customer.code}`,
            description: description || '',
            tariffCategory: 'HT',
            customerReference: customerReference || undefined,
            validityDate: validityDate,
            totalHT: totalHT,
            totalTVA: totalTVA,
            totalTTC: totalTTC,
            items: resolvedItems,
            components: resolvedComponents,
          };

          let createdDocument;
          try {
            createdDocument = await documentService.create(createDocumentDto, tenantId, userId);
          } catch (error) {
            return `❌ Erreur lors de la création du devis : ${error?.message || 'Erreur inconnue'}. Veuillez réessayer ou contacter l'administrateur.`;
          }

          // Message de succès
          const customerDisplayName = customer.individual?.firstname && customer.individual?.lastname
            ? `${customer.individual.firstname} ${customer.individual.lastname}`
            : customer.professional?.raisonSociale || customer.publicEntity?.name || customer.code;

          let successMessage = `✅ Devis créé avec succès !\n`;
          successMessage += `📄 Code: ${createdDocument.code || 'N/A'}\n`;
          successMessage += `👤 Client: ${customerDisplayName}\n`;
          successMessage += `💰 Montant TTC: ${totalTTC.toFixed(2)} €\n`;
          successMessage += `📦 Items: ${resolvedItems.length}\n`;

          return successMessage;
        } catch (error: any) {
          return handleToolError(error, 'créer le devis');
        }
      },
      {
        name: 'create_devis',
        description:
          'Créer un nouveau devis avec des filtres avancés. Utilise cet outil quand l\'utilisateur demande de créer un devis. FONCTIONNALITÉS : 1) Recherche automatique du client par ID ou nom. 2) Récupération automatique de l\'adresse de facturation. 3) Sélection automatique du taux de TVA (20% par défaut ou celui spécifié). 4) Récupération automatique de la société de l\'utilisateur. 5) Calcul automatique des totaux HT/TTC avec TVA. 6) Gestion des items (articles/ouvrages) avec quantités et prix. IMPORTANT: Le paramètre "customerId" ou "customerName" est requis. Le paramètre "items" est requis avec au moins un article. Les items peuvent inclure componentId, componentRef, componentName, quantity, unitPriceHT, et tvaRateId.',
        schema: {
          type: 'object',
          properties: {
            customerId: {
              type: 'string',
              description: 'ID technique du client (usage interne). Utilisez customerName de préférence.',
            },
            customerName: {
              type: 'string',
              description: 'Nom du client pour recherche automatique (ex: "Jean Dupont", "ABC Construction"). La recherche est tolérante aux fautes de frappe.',
            },
            companyId: {
              type: 'string',
              description: 'ID technique de la société (optionnel). Si non fourni, la première société de l\'utilisateur sera utilisée.',
            },
            title: {
              type: 'string',
              description: 'Titre du devis (optionnel). Si non fourni, un titre par défaut sera généré avec le nom du client.',
            },
            description: {
              type: 'string',
              description: 'Description optionnelle du devis.',
            },
            items: {
              type: 'array',
              description: 'Liste des items à inclure dans le devis. Maximum 50 items. Chaque item doit avoir: type (ARTICLE ou OUVRAGE), quantity, et optionnellement componentId, componentRef, componentName, unitPriceHT, tvaRateId.',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['ARTICLE', 'OUVRAGE'],
                    description: 'Type d\'item : ARTICLE ou OUVRAGE',
                  },
                  componentId: {
                    type: 'string',
                    description: 'ID technique du composant (article ou ouvrage)',
                  },
                  componentRef: {
                    type: 'string',
                    description: 'Référence du composant (code)',
                  },
                  componentName: {
                    type: 'string',
                    description: 'Nom du composant (pour référence)',
                  },
                  quantity: {
                    type: 'number',
                    description: 'Quantité de l\'item (doit être > 0 et <= 10000)',
                  },
                  unitPriceHT: {
                    type: 'number',
                    description: 'Prix unitaire HT optionnel. Si non fourni, 0 sera utilisé.',
                  },
                  tvaRateId: {
                    type: 'string',
                    description: 'ID du taux de TVA pour cet item (optionnel). Si non fourni, le taux de TVA du devis sera utilisé.',
                  },
                },
                required: ['type', 'quantity'],
              },
            },
            validityDays: {
              type: 'number',
              description: 'Nombre de jours de validité du devis (par défaut 30 jours)',
            },
            customerReference: {
              type: 'string',
              description: 'Référence client optionnelle pour le devis',
            },
            tvaRateId: {
              type: 'string',
              description: 'ID du taux de TVA pour le devis (optionnel). Si non fourni, 20% sera utilisé par défaut.',
            },
            conditionRegulationId: {
              type: 'string',
              description: 'ID de la condition de règlement (optionnel). Si non fourni, celle du client sera utilisée.',
            },
            workAddressId: {
              type: 'string',
              description: 'ID de l\'adresse de chantier (optionnel)',
            },
          },
          required: ['items'],
        },
      },
    ),

    // Outil pour créer ou modifier un article
    tool(
      async ({
        articleName,
        articleCode,
        catalogName,
        name,
        code,
        label,
        commercialDescription,
        purchasePrice,
        sellingPrice,
        margin,
        photo,
        familyNames,
        saleUnitId,
        purchaseUnitId,
        articleNatureId,
        conversionCoefficient,
      }: {
        articleName?: string;
        articleCode?: string;
        catalogName: string;
        name: string;
        code?: string;
        label?: string;
        commercialDescription?: string;
        purchasePrice?: number;
        sellingPrice?: number;
        margin?: number;
        photo?: string;
        familyNames?: string[];
        saleUnitId?: string;
        purchaseUnitId?: string;
        articleNatureId?: string;
        conversionCoefficient?: number;
      }) => {
        try {
          if (!catalogName || !name) {
            return '❌ Erreur : catalogName et name sont requis pour créer ou modifier un article.';
          }

          // Rechercher le catalogue par nom
          const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
          
          // Si articleName ou articleCode est fourni, rechercher l'article existant
          let articleId: string | undefined;
          if (articleName || articleCode) {
            try {
              const existingArticle = await findArticleByNameOrCode(
                catalogMergeService,
                articleName || articleCode!,
                catalog.catalogId,
                tenantId,
              );
              articleId = existingArticle.articleId;
            } catch (error) {
              // Article non trouvé, on crée un nouvel article
            }
          }

          // Résoudre les familles par nom
          const familyIds: string[] = [];
          if (familyNames && familyNames.length > 0) {
            for (const familyName of familyNames) {
              try {
                const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
                familyIds.push(family.familyId);
              } catch (error) {
                return `❌ Erreur : Famille "${familyName}" non trouvée dans le catalogue "${catalogName}".`;
              }
            }
          }

          const articleDto: any = {
            catalogId: catalog.catalogId,
            name: name.trim(),
            code: code?.trim(),
            label: label?.trim() || null,
            commercialDescription: commercialDescription?.trim() || null,
            purchasePrice: purchasePrice || null,
            sellingPrice: sellingPrice || null,
            margin: margin || null,
            photo: photo?.trim() || null,
            familyIds,
            saleUnitId: saleUnitId || undefined,
            purchaseUnitId: purchaseUnitId || undefined,
            articleNatureId: articleNatureId || undefined,
            conversionCoefficient: conversionCoefficient || null,
          };

          if (articleId) {
            articleDto.articleId = articleId;
          }

          const savedArticle = await catalogLayerService.saveArticle(articleDto, tenantId);

          const action = articleId ? 'modifié' : 'créé';
          return `✅ Article ${action} avec succès !\n📦 Code: ${savedArticle.code || 'N/A'}\n📝 Nom: ${savedArticle.name || 'N/A'}\n💰 Prix de vente: ${savedArticle.sellingPrice || 0} €`;
        } catch (error: any) {
          return handleToolError(error, articleName || articleCode ? 'modifier l\'article' : 'créer l\'article');
        }
      },
      {
        name: 'save_article',
        description:
          'Créer ou modifier un article dans un catalogue. Utilise cet outil quand l\'utilisateur demande de créer, modifier ou mettre à jour un article. IMPORTANT: Utilisez catalogName (nom du catalogue) au lieu de catalogId, et articleName ou articleCode pour modifier un article existant. Les familles peuvent être spécifiées par leur nom (familyNames) au lieu d\'IDs. Si articleName ou articleCode est fourni, l\'article sera modifié, sinon un nouvel article sera créé.',
        schema: {
          type: 'object',
          properties: {
            articleName: {
              type: 'string',
              description: 'Nom de l\'article existant à modifier (optionnel, utilisez articleCode si vous avez le code)',
            },
            articleCode: {
              type: 'string',
              description: 'Code de l\'article existant à modifier (optionnel, utilisez articleName si vous avez le nom)',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue dans lequel créer/modifier l\'article (requis, ex: "Catalogue principal")',
            },
            name: {
              type: 'string',
              description: 'Nom de l\'article (requis)',
            },
            code: {
              type: 'string',
              description: 'Code unique de l\'article (optionnel, généré automatiquement si non fourni)',
            },
            label: {
              type: 'string',
              description: 'Libellé de l\'article (optionnel)',
            },
            commercialDescription: {
              type: 'string',
              description: 'Description commerciale de l\'article (optionnel)',
            },
            purchasePrice: {
              type: 'number',
              description: 'Prix d\'achat HT en euros (optionnel)',
            },
            sellingPrice: {
              type: 'number',
              description: 'Prix de vente HT en euros (optionnel)',
            },
            margin: {
              type: 'number',
              description: 'Marge en pourcentage (optionnel)',
            },
            photo: {
              type: 'string',
              description: 'URL ou chemin de la photo de l\'article (optionnel)',
            },
            familyNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Liste des noms des familles auxquelles associer l\'article (optionnel, ex: ["Électricité", "Plomberie"])',
            },
            saleUnitId: {
              type: 'string',
              description: 'ID de l\'unité de vente (optionnel, usage technique)',
            },
            purchaseUnitId: {
              type: 'string',
              description: 'ID de l\'unité d\'achat (optionnel, usage technique)',
            },
            articleNatureId: {
              type: 'string',
              description: 'ID de la nature de l\'article (optionnel, usage technique)',
            },
            conversionCoefficient: {
              type: 'number',
              description: 'Coefficient de conversion entre unité d\'achat et unité de vente (optionnel)',
            },
          },
          required: ['catalogName', 'name'],
        },
      },
    ),

    // Outil pour supprimer un article
    tool(
      async ({ articleName, articleCode, catalogName }: { 
        articleName?: string;
        articleCode?: string;
        catalogName?: string;
      }) => {
        try {
          if (!articleName && !articleCode) {
            return '❌ Erreur : articleName ou articleCode est requis pour supprimer un article.';
          }

          let article: any;
          if (catalogName) {
            const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
            article = await findArticleByNameOrCode(catalogMergeService, articleName || articleCode!, catalog.catalogId, tenantId);
          } else {
            article = await findArticleByNameOrCode(catalogMergeService, articleName || articleCode!, undefined, tenantId);
          }

          await catalogLayerService.removeArticle(article.articleId, tenantId);
          return `✅ Article supprimé avec succès !\n📦 Nom: ${article.name || articleCode}\n📝 Code: ${article.code || 'N/A'}`;
        } catch (error: any) {
          return handleToolError(error, 'supprimer l\'article');
        }
      },
      {
        name: 'remove_article',
        description:
          'Supprimer un article (marquage comme supprimé). Utilise cet outil quand l\'utilisateur demande de supprimer un article. IMPORTANT: Utilisez articleName ou articleCode au lieu de articleId. Si catalogName est fourni, la recherche sera plus rapide. L\'article sera marqué comme supprimé mais ne sera pas physiquement supprimé de la base de données.',
        schema: {
          type: 'object',
          properties: {
            articleName: {
              type: 'string',
              description: 'Nom de l\'article à supprimer (requis si articleCode n\'est pas fourni)',
            },
            articleCode: {
              type: 'string',
              description: 'Code de l\'article à supprimer (requis si articleName n\'est pas fourni)',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue contenant l\'article (optionnel, mais recommandé pour une recherche plus rapide)',
            },
          },
        },
      },
    ),

    // Outil pour créer ou modifier une famille
    tool(
      async ({
        familyName,
        catalogName,
        name,
        parentName,
      }: {
        familyName?: string;
        catalogName: string;
        name: string;
        parentName?: string;
      }) => {
        try {
          if (!catalogName || !name) {
            return '❌ Erreur : catalogName et name sont requis pour créer ou modifier une famille.';
          }

          // Rechercher le catalogue par nom
          const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);

          // Si familyName est fourni, rechercher la famille existante
          let familyId: string | undefined;
          if (familyName) {
            try {
              const existingFamily = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
              familyId = existingFamily.familyId;
            } catch (error) {
              // Famille non trouvée, on crée une nouvelle famille
            }
          }

          // Résoudre la famille parente par nom si fournie
          let parentId: string | undefined;
          if (parentName) {
            try {
              const parentFamily = await findFamilyByName(catalogMergeService, parentName, catalog.catalogId, tenantId);
              parentId = parentFamily.familyId;
            } catch (error) {
              return `❌ Erreur : Famille parente "${parentName}" non trouvée dans le catalogue "${catalogName}".`;
            }
          }

          const familyDto: any = {
            catalogId: catalog.catalogId,
            name: name.trim(),
            parentId: parentId || undefined,
          };

          if (familyId) {
            familyDto.familyId = familyId;
          }

          const savedFamily = await catalogLayerService.saveFamily(familyDto, tenantId);

          const action = familyId ? 'modifiée' : 'créée';
          return `✅ Famille ${action} avec succès !\n📁 Nom: ${savedFamily.name || 'N/A'}`;
        } catch (error: any) {
          return handleToolError(error, familyName ? 'modifier la famille' : 'créer la famille');
        }
      },
      {
        name: 'save_family',
        description:
          'Créer ou modifier une famille dans un catalogue. Utilise cet outil quand l\'utilisateur demande de créer, modifier ou mettre à jour une famille. IMPORTANT: Utilisez catalogName (nom du catalogue) au lieu de catalogId, et familyName pour modifier une famille existante. La famille parente peut être spécifiée par son nom (parentName) au lieu d\'un ID. Si familyName est fourni, la famille sera modifiée, sinon une nouvelle famille sera créée.',
        schema: {
          type: 'object',
          properties: {
            familyName: {
              type: 'string',
              description: 'Nom de la famille existante à modifier (optionnel, si non fourni, une nouvelle famille sera créée)',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue dans lequel créer/modifier la famille (requis, ex: "Catalogue principal")',
            },
            name: {
              type: 'string',
              description: 'Nom de la famille (requis)',
            },
            parentName: {
              type: 'string',
              description: 'Nom de la famille parente pour créer une hiérarchie (optionnel, ex: "Électricité")',
            },
          },
          required: ['catalogName', 'name'],
        },
      },
    ),

    // Outil pour supprimer une famille
    tool(
      async ({ familyName, catalogName }: { 
        familyName: string;
        catalogName: string;
      }) => {
        try {
          if (!familyName || !catalogName) {
            return '❌ Erreur : familyName et catalogName sont requis pour supprimer une famille.';
          }

          const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
          const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);

          await catalogLayerService.removeFamily(family.familyId, tenantId);
          return `✅ Famille supprimée avec succès !\n📁 Nom: ${family.name || 'N/A'}`;
        } catch (error: any) {
          return handleToolError(error, 'supprimer la famille');
        }
      },
      {
        name: 'remove_family',
        description:
          'Supprimer une famille (marquage comme supprimée). Utilise cet outil quand l\'utilisateur demande de supprimer une famille. IMPORTANT: Utilisez familyName et catalogName au lieu de familyId. La famille sera marquée comme supprimée mais ne sera pas physiquement supprimée de la base de données. IMPORTANT: La famille ne doit pas contenir d\'articles ou d\'ouvrages, et ne doit pas avoir de familles enfants.',
        schema: {
          type: 'object',
          properties: {
            familyName: {
              type: 'string',
              description: 'Nom de la famille à supprimer (requis, ex: "Électricité")',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue contenant la famille (requis, ex: "Catalogue principal")',
            },
          },
          required: ['familyName', 'catalogName'],
        },
      },
    ),

    // Outil pour créer ou modifier un ouvrage
    tool(
      async ({
        ouvrageDesignation,
        catalogName,
        designation,
        prix,
        unitId,
        familyNames,
        lignesOuvrage,
      }: {
        ouvrageDesignation?: string;
        catalogName: string;
        designation: string;
        prix?: number;
        unitId?: string;
        familyNames?: string[];
        lignesOuvrage?: Array<{
          typeLigneOuvrage: string;
          noOrdre: number;
          ligneOuvrageArticle?: {
            quantite: number;
            articleName?: string;
            articleCode?: string;
          };
          comment?: {
            description?: string;
          };
        }>;
      }) => {
        try {
          if (!catalogName || !designation) {
            return '❌ Erreur : catalogName et designation sont requis pour créer ou modifier un ouvrage.';
          }

          // Rechercher le catalogue par nom
          const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);

          // Si ouvrageDesignation est fourni, rechercher l'ouvrage existant
          let ouvrageId: string | undefined;
          if (ouvrageDesignation) {
            try {
              const existingOuvrage = await findOuvrageByDesignation(catalogMergeService, ouvrageDesignation, catalog.catalogId, tenantId);
              ouvrageId = existingOuvrage.ouvrageId;
            } catch (error) {
              // Ouvrage non trouvé, on crée un nouvel ouvrage
            }
          }

          // Résoudre les familles par nom
          const familyIds: string[] = [];
          if (familyNames && familyNames.length > 0) {
            for (const familyName of familyNames) {
              try {
                const family = await findFamilyByName(catalogMergeService, familyName, catalog.catalogId, tenantId);
                familyIds.push(family.familyId);
              } catch (error) {
                return `❌ Erreur : Famille "${familyName}" non trouvée dans le catalogue "${catalogName}".`;
              }
            }
          }

          // Résoudre les articles dans les lignes d'ouvrage par nom ou code
          const resolvedLignesOuvrage: any[] = [];
          if (lignesOuvrage && lignesOuvrage.length > 0) {
            for (const ligne of lignesOuvrage) {
              const resolvedLigne: any = {
                typeLigneOuvrage: ligne.typeLigneOuvrage,
                noOrdre: ligne.noOrdre,
                comment: ligne.comment,
              };

              if (ligne.ligneOuvrageArticle) {
                try {
                  const article = await findArticleByNameOrCode(
                    catalogMergeService,
                    ligne.ligneOuvrageArticle.articleName || ligne.ligneOuvrageArticle.articleCode!,
                    catalog.catalogId,
                    tenantId,
                  );
                  resolvedLigne.ligneOuvrageArticle = {
                    quantite: ligne.ligneOuvrageArticle.quantite,
                    articleId: article.articleId,
                  };
                } catch (error) {
                  return `❌ Erreur : Article "${ligne.ligneOuvrageArticle.articleName || ligne.ligneOuvrageArticle.articleCode}" non trouvé dans le catalogue "${catalogName}".`;
                }
              }

              resolvedLignesOuvrage.push(resolvedLigne);
            }
          }

          const ouvrageDto: any = {
            catalogId: catalog.catalogId,
            designation: designation.trim(),
            prix: prix || undefined,
            unitId: unitId || undefined,
            familyIds,
            lignesOuvrage: resolvedLignesOuvrage,
          };

          if (ouvrageId) {
            ouvrageDto.ouvrageId = ouvrageId;
          }

          const savedOuvrage = await catalogLayerService.saveOuvrage(ouvrageDto, tenantId);

          const action = ouvrageId ? 'modifié' : 'créé';
          return `✅ Ouvrage ${action} avec succès !\n📝 Désignation: ${savedOuvrage.designation || 'N/A'}\n💰 Prix: ${savedOuvrage.prix || 0} €`;
        } catch (error: any) {
          return handleToolError(error, ouvrageDesignation ? 'modifier l\'ouvrage' : 'créer l\'ouvrage');
        }
      },
      {
        name: 'save_ouvrage',
        description:
          'Créer ou modifier un ouvrage dans un catalogue. Utilise cet outil quand l\'utilisateur demande de créer, modifier ou mettre à jour un ouvrage. IMPORTANT: Utilisez catalogName (nom du catalogue) au lieu de catalogId, et ouvrageDesignation pour modifier un ouvrage existant. Les familles peuvent être spécifiées par leur nom (familyNames) au lieu d\'IDs. Les articles dans les lignes d\'ouvrage peuvent être spécifiés par leur nom (articleName) ou code (articleCode) au lieu d\'articleId. Si ouvrageDesignation est fourni, l\'ouvrage sera modifié, sinon un nouvel ouvrage sera créé.',
        schema: {
          type: 'object',
          properties: {
            ouvrageDesignation: {
              type: 'string',
              description: 'Désignation de l\'ouvrage existant à modifier (optionnel, si non fourni, un nouvel ouvrage sera créé)',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue dans lequel créer/modifier l\'ouvrage (requis, ex: "Catalogue principal")',
            },
            designation: {
              type: 'string',
              description: 'Désignation de l\'ouvrage (requis)',
            },
            prix: {
              type: 'number',
              description: 'Prix de l\'ouvrage en euros (optionnel)',
            },
            unitId: {
              type: 'string',
              description: 'ID de l\'unité de mesure (optionnel, usage technique)',
            },
            familyNames: {
              type: 'array',
              items: { type: 'string' },
              description: 'Liste des noms des familles auxquelles associer l\'ouvrage (optionnel, ex: ["Électricité", "Plomberie"])',
            },
            lignesOuvrage: {
              type: 'array',
              description: 'Liste des lignes d\'ouvrage (optionnel, mais recommandé pour les ouvrages complexes)',
              items: {
                type: 'object',
                properties: {
                  typeLigneOuvrage: {
                    type: 'string',
                    enum: ['ARTICLE', 'COMMENTAIRE'],
                    description: 'Type de ligne : ARTICLE ou COMMENTAIRE',
                  },
                  noOrdre: {
                    type: 'number',
                    description: 'Numéro d\'ordre de la ligne (requis)',
                  },
                  ligneOuvrageArticle: {
                    type: 'object',
                    description: 'Détails de l\'article si typeLigneOuvrage est ARTICLE',
                    properties: {
                      quantite: {
                        type: 'number',
                        description: 'Quantité de l\'article',
                      },
                      articleName: {
                        type: 'string',
                        description: 'Nom de l\'article (requis si articleCode n\'est pas fourni)',
                      },
                      articleCode: {
                        type: 'string',
                        description: 'Code de l\'article (requis si articleName n\'est pas fourni)',
                      },
                    },
                  },
                  comment: {
                    type: 'object',
                    description: 'Commentaire si typeLigneOuvrage est COMMENTAIRE',
                    properties: {
                      description: {
                        type: 'string',
                        description: 'Description du commentaire',
                      },
                    },
                  },
                },
              },
            },
          },
          required: ['catalogName', 'designation'],
        },
      },
    ),

    // Outil pour supprimer un ouvrage
    tool(
      async ({ ouvrageDesignation, catalogName }: { 
        ouvrageDesignation: string;
        catalogName: string;
      }) => {
        try {
          if (!ouvrageDesignation || !catalogName) {
            return '❌ Erreur : ouvrageDesignation et catalogName sont requis pour supprimer un ouvrage.';
          }

          const catalog = await findCatalogByName(catalogService, catalogMergeService, catalogName, tenantId);
          const ouvrage = await findOuvrageByDesignation(catalogMergeService, ouvrageDesignation, catalog.catalogId, tenantId);

          await catalogLayerService.removeOuvrage(ouvrage.ouvrageId, tenantId);
          return `✅ Ouvrage supprimé avec succès !\n📝 Désignation: ${ouvrage.designation || 'N/A'}`;
        } catch (error: any) {
          return handleToolError(error, 'supprimer l\'ouvrage');
        }
      },
      {
        name: 'remove_ouvrage',
        description:
          'Supprimer un ouvrage (marquage comme supprimé). Utilise cet outil quand l\'utilisateur demande de supprimer un ouvrage. IMPORTANT: Utilisez ouvrageDesignation et catalogName au lieu de ouvrageId. L\'ouvrage sera marqué comme supprimé mais ne sera pas physiquement supprimé de la base de données.',
        schema: {
          type: 'object',
          properties: {
            ouvrageDesignation: {
              type: 'string',
              description: 'Désignation de l\'ouvrage à supprimer (requis, ex: "Installation électrique complète")',
            },
            catalogName: {
              type: 'string',
              description: 'Nom du catalogue contenant l\'ouvrage (requis, ex: "Catalogue principal")',
            },
          },
          required: ['ouvrageDesignation', 'catalogName'],
        },
      },
    ),
  ];
}


