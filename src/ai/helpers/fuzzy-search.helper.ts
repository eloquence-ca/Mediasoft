/**
 * Helper pour la recherche floue (fuzzy search)
 * Permet de trouver des correspondances approximatives
 */

/**
 * Normalise une chaîne pour la recherche
 * - Minuscule
 * - Supprime les accents
 * - Supprime les caractères spéciaux
 * - Supprime les espaces multiples
 */
export function normalizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toLowerCase()
    .trim()
    // Supprimer les accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Supprimer les caractères spéciaux (garder uniquement lettres, chiffres et espaces)
    .replace(/[^a-z0-9\s]/g, '')
    // Remplacer les espaces multiples par un seul espace
    .replace(/\s+/g, ' ')
    // Supprimer les espaces au début et à la fin
    .trim();
}

/**
 * Calcule la similarité entre deux chaînes (Levenshtein simplifié)
 * Retourne un score entre 0 et 1 (1 = identique)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Recherche de sous-chaîne (plus rapide pour les recherches fréquentes)
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }

  // Distance de Levenshtein
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j] + 1,    // suppression
        );
      }
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  
  return 1 - distance / maxLength;
}

/**
 * Trouve le meilleur match dans une liste
 * @param query Terme de recherche
 * @param items Liste d'objets à rechercher
 * @param fieldName Nom du champ à comparer
 * @param threshold Seuil de similarité (0-1), défaut 0.5
 * @returns L'élément le plus similaire ou undefined
 */
export function findBestMatch<T extends Record<string, any>>(
  query: string,
  items: T[],
  fieldName: keyof T,
  threshold: number = 0.5,
): T | undefined {
  if (!query || !items || items.length === 0) return undefined;

  const normalizedQuery = normalizeString(query);
  let bestMatch: T | undefined;
  let bestScore = threshold;

  for (const item of items) {
    const fieldValue = item[fieldName];
    if (!fieldValue || typeof fieldValue !== 'string') continue;

    const score = calculateSimilarity(normalizedQuery, normalizeString(fieldValue));
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestMatch;
}

/**
 * Trouve tous les matches au-dessus d'un seuil dans une liste
 * @param query Terme de recherche
 * @param items Liste d'objets à rechercher
 * @param fieldName Nom du champ à comparer
 * @param threshold Seuil de similarité (0-1), défaut 0.5
 * @returns Liste des éléments correspondants triés par score décroissant
 */
export function findAllMatches<T extends Record<string, any>>(
  query: string,
  items: T[],
  fieldName: keyof T,
  threshold: number = 0.5,
): Array<{ item: T; score: number }> {
  if (!query || !items || items.length === 0) return [];

  const normalizedQuery = normalizeString(query);
  const matches: Array<{ item: T; score: number }> = [];

  for (const item of items) {
    const fieldValue = item[fieldName];
    if (!fieldValue || typeof fieldValue !== 'string') continue;

    const score = calculateSimilarity(normalizedQuery, normalizeString(fieldValue));
    
    if (score >= threshold) {
      matches.push({ item, score });
    }
  }

  // Trier par score décroissant
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Recherche par préfixe (commence par)
 */
export function findByPrefix<T extends Record<string, any>>(
  query: string,
  items: T[],
  fieldName: keyof T,
): T[] {
  if (!query || !items || items.length === 0) return [];

  const normalizedQuery = normalizeString(query);
  
  return items.filter((item) => {
    const fieldValue = item[fieldName];
    if (!fieldValue || typeof fieldValue !== 'string') return false;
    return normalizeString(fieldValue).startsWith(normalizedQuery);
  });
}

/**
 * Recherche par inclusion (contient)
 */
export function findByInclusion<T extends Record<string, any>>(
  query: string,
  items: T[],
  fieldName: keyof T,
): T[] {
  if (!query || !items || items.length === 0) return [];

  const normalizedQuery = normalizeString(query);
  
  return items.filter((item) => {
    const fieldValue = item[fieldName];
    if (!fieldValue || typeof fieldValue !== 'string') return false;
    return normalizeString(fieldValue).includes(normalizedQuery);
  });
}

/**
 * Suggestions pour une recherche infructueuse
 */
export function getSuggestions<T extends Record<string, any>>(
  query: string,
  items: T[],
  fieldName: keyof T,
  maxSuggestions: number = 3,
): string[] {
  if (!query || !items || items.length === 0) return [];

  const matches = findAllMatches(query, items, fieldName, 0.3);
  
  // Prendre les top matches
  return matches
    .slice(0, maxSuggestions)
    .map((m) => String(m.item[fieldName]));
}
