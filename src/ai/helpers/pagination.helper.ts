/**
 * Helper pour la pagination des résultats
 */

/**
 * Options de pagination
 */
export interface PaginationOptions {
  page?: number;    // Page actuelle (défaut: 1)
  limit?: number;   // Nombre d'éléments par page (défaut: 20)
  maxLimit?: number; // Limite maximale autorisée (défaut: 100)
}

/**
 * Métadonnées de pagination pour la réponse
 */
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Valeurs par défaut de pagination
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_LIMIT = 100;

/**
 * Valide et normalise les options de pagination
 */
export function normalizePaginationOptions(options: PaginationOptions = {}): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, options.page || DEFAULT_PAGE);
  const maxLimit = options.maxLimit || DEFAULT_MAX_LIMIT;
  const limit = Math.min(Math.max(1, options.limit || DEFAULT_LIMIT), maxLimit);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Crée les métadonnées de pagination
 */
export function createPaginationMeta<T>(
  items: T[],
  page: number,
  limit: number,
  totalItems: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage: page,
    itemsPerPage: limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Paginé un tableau d'éléments
 */
export function paginateArray<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = Math.min(page, totalPages || 1);
  const skip = (currentPage - 1) * limit;
  
  const data = items.slice(skip, skip + limit);

  return {
    data,
    meta: createPaginationMeta(data, currentPage, limit, totalItems),
  };
}

/**
 * Formate une réponse paginée pour l'agent IA
 */
export function formatPaginatedResponse<T extends Record<string, any>>(
  items: T[],
  page: number,
  limit: number,
  totalItems: number,
  options?: {
    itemFormatter?: (item: T, index: number) => string;
    emptyMessage?: string;
  },
): string {
  const result = paginateArray(items, page, limit);
  
  if (result.data.length === 0) {
    return options?.emptyMessage || 'Aucun résultat trouvé.';
  }

  let response = `Résultats (page ${result.meta.currentPage}/${result.meta.totalPages}) :\\n\\n`;

  result.data.forEach((item, index) => {
    if (options?.itemFormatter) {
      response += `• ${options.itemFormatter(item, index)}\\n`;
    } else {
      // Format par défaut
      const name = item.name || item.label || item.designation || item.title || item.code || 'N/A';
      response += `• ${name}`;
      
      // Ajouter des infos supplémentaires si disponibles
      const extra: string[] = [];
      if (item.code && item.code !== name) extra.push(item.code);
      if (item.type) extra.push(item.type);
      if (typeof item.sellingPrice === 'number') extra.push(`${item.sellingPrice.toFixed(2)} €`);
      if (typeof item.amount === 'number') extra.push(`${item.amount.toFixed(2)} €`);
      
      if (extra.length > 0) {
        response += ` - ${extra.join(' - ')}`;
      }
      response += '\\n';
    }
  });

  response += `\\nTotal: ${result.meta.totalItems} résultat(s)`;
  
  if (result.meta.hasNextPage) {
    response += ` (page ${result.meta.currentPage + 1}/${result.meta.totalPages} disponible)`;
  }

  return response;
}

/**
 * Extrait les paramètres de pagination depuis une query string ou objet
 */
export function extractPaginationParams(params: Record<string, any>): PaginationOptions {
  return {
    page: typeof params.page === 'string' ? parseInt(params.page, 10) : params.page,
    limit: typeof params.limit === 'string' ? parseInt(params.limit, 10) : params.limit,
  };
}
