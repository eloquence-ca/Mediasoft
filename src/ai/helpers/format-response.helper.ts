/**
 * Helper pour formater les réponses de manière lisible et sans IDs
 * Améliore l'expérience utilisateur en rendant les données plus compréhensibles
 */

/**
 * Supprime les IDs et propriétés techniques d'un objet
 */
function removeIds(obj: any, depth = 0): any {
  if (depth > 10) return obj; // Protection contre les boucles infinies

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeIds(item, depth + 1));
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const cleaned: any = {};
  const idPatterns = [
    /^id$/i,
    /^id[A-Z]/,
    /Id$/,
    /_id$/i,
    /^uuid$/i,
    /tenantId/i,
    /idTenant/i,
    /idCustomer/i,
    /idCompany/i,
    /idDirectory/i,
    /idCatalog/i,
    /idArticle/i,
    /idOuvrage/i,
    /idFamily/i,
    /idDocument/i,
    /idAddress/i,
    /idContact/i,
    /idTva/i,
    /idCondition/i,
    /createdAt/i,
    /updatedAt/i,
    /deletedAt/i,
    /creationDate/i,
    /updatedDate/i,
    /deletedDate/i,
  ];

  for (const [key, value] of Object.entries(obj)) {
    // Ignorer les IDs et propriétés techniques
    if (idPatterns.some((pattern) => pattern.test(key))) {
      continue;
    }

    // Ignorer les relations TypeORM complexes
    if (key === '__entity' || key === '__type') {
      continue;
    }

    // Récursivement nettoyer les objets imbriqués
    if (typeof value === 'object' && value !== null) {
      cleaned[key] = removeIds(value, depth + 1);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Formate un client pour l'affichage
 */
function formatCustomer(customer: any): any {
  if (!customer) return null;

  const formatted: any = {};

  // Informations de base
  if (customer.code) formatted.code = customer.code;
  if (customer.email) formatted.email = customer.email;
  if (customer.phone) formatted.telephone = customer.phone;
  if (customer.type) formatted.type = customer.type;
  if (customer.status) formatted.statut = customer.status;

  // Informations selon le type
  if (customer.individual) {
    formatted.nom = `${customer.individual.firstname || ''} ${customer.individual.lastname || ''}`.trim();
    if (customer.individual.civility) formatted.civilite = customer.individual.civility;
  }

  if (customer.professional) {
    formatted.raisonSociale = customer.professional.companyName;
    if (customer.professional.siret) formatted.siret = customer.professional.siret;
  }

  if (customer.publicEntity) {
    formatted.nomEntite = customer.publicEntity.entityName;
    if (customer.publicEntity.siret) formatted.siret = customer.publicEntity.siret;
  }

  // Répertoire
  if (customer.directory) {
    formatted.repertoire = customer.directory.name || customer.directory.companyName || null;
  }

  return formatted;
}

/**
 * Formate un montant pour l'affichage
 */
function formatAmount(amount: number | string | undefined | null): string | undefined {
  if (amount === undefined || amount === null) return undefined;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return undefined;
  return `${numAmount.toFixed(2).replace('.', ',')} €`;
}

/**
 * Formate un document (devis/commande) pour l'affichage
 */
function formatDocument(document: any): any {
  if (!document) return null;

  const formatted: any = {};

  if (document.title) formatted.titre = document.title;
  if (document.description) formatted.description = document.description;
  if (document.type?.name) formatted.type = document.type.name;
  if (document.type?.code) formatted.typeCode = document.type.code;
  // Utiliser label au lieu de name pour le statut (DocumentState a un champ label)
  if (document.state?.label) formatted.etat = document.state.label;
  if (document.state?.code) formatted.codeEtat = document.state.code;
  
  // Formater les montants
  if (document.totalHT !== undefined && document.totalHT !== null) {
    formatted.totalHT = formatAmount(document.totalHT);
  }
  if (document.totalTVA !== undefined && document.totalTVA !== null) {
    formatted.totalTVA = formatAmount(document.totalTVA);
  }
  if (document.totalTTC !== undefined && document.totalTTC !== null) {
    formatted.totalTTC = formatAmount(document.totalTTC);
  }

  // Client
  if (document.customer) {
    formatted.client = formatCustomer(document.customer);
  }

  // Société
  if (document.company) {
    formatted.societe = document.company.name;
  }

  return formatted;
}

/**
 * Formate un article pour l'affichage
 */
function formatArticle(article: any): any {
  if (!article) return null;

  const formatted: any = {};

  if (article.designation) formatted.designation = article.designation;
  if (article.reference) formatted.reference = article.reference;
  if (article.prix !== undefined && article.prix !== null) {
    formatted.prix = formatAmount(article.prix);
  }
  if (article.unite) formatted.unite = article.unite?.name || article.unite;
  if (article.famille) formatted.famille = article.famille?.name || article.famille;
  if (article.catalog) formatted.catalogue = article.catalog?.name || article.catalog;

  return formatted;
}

/**
 * Formate un ouvrage pour l'affichage
 */
function formatOuvrage(ouvrage: any): any {
  if (!ouvrage) return null;

  const formatted: any = {};

  if (ouvrage.designation) formatted.designation = ouvrage.designation;
  if (ouvrage.prix !== undefined && ouvrage.prix !== null) {
    formatted.prix = formatAmount(ouvrage.prix);
  }
  if (ouvrage.catalog) formatted.catalogue = ouvrage.catalog?.name || ouvrage.catalog;
  if (ouvrage.families && Array.isArray(ouvrage.families)) {
    formatted.familles = ouvrage.families.map((f: any) => f.name || f).filter(Boolean);
  }

  return formatted;
}

/**
 * Formate un catalogue pour l'affichage
 */
function formatCatalog(catalog: any): any {
  if (!catalog) return null;

  const formatted: any = {};

  if (catalog.name) formatted.nom = catalog.name;
  if (catalog.description) formatted.description = catalog.description;
  
  // Compter les familles
  if (catalog.families && Array.isArray(catalog.families)) {
    formatted.nombreFamilles = catalog.families.length;
  }
  
  // Compter les articles
  if (catalog.articles && Array.isArray(catalog.articles)) {
    formatted.nombreArticles = catalog.articles.length;
  }
  
  // Compter les ouvrages
  if (catalog.ouvrages && Array.isArray(catalog.ouvrages)) {
    formatted.nombreOuvrages = catalog.ouvrages.length;
  }
  
  // Compter les sociétés associées
  if (catalog.companies && Array.isArray(catalog.companies)) {
    formatted.nombreSocietes = catalog.companies.length;
  }

  return formatted;
}

/**
 * Formate une société pour l'affichage
 */
function formatCompany(company: any): any {
  if (!company) return null;

  const formatted: any = {};

  if (company.name) formatted.nom = company.name;
  if (company.siret) formatted.siret = company.siret;
  if (company.address) formatted.adresse = company.address;

  return formatted;
}

/**
 * Formate un utilisateur pour l'affichage
 */
function formatUser(user: any): any {
  if (!user) return null;

  const formatted: any = {};

  if (user.firstname || user.lastname) {
    formatted.nom = `${user.firstname || ''} ${user.lastname || ''}`.trim();
  }
  if (user.email) formatted.email = user.email;
  if (user.phone) formatted.telephone = user.phone;
  if (user.cellPhone) formatted.mobile = user.cellPhone;
  if (user.civility) formatted.civilite = user.civility;
  if (user.isAdmin !== undefined) formatted.estAdmin = user.isAdmin;
  if (user.slug) formatted.slug = user.slug;

  // Sociétés associées
  if (user.userCompanies && Array.isArray(user.userCompanies)) {
    formatted.societes = user.userCompanies.map((uc: any) => {
      if (uc.company) {
        return formatCompany(uc.company);
      }
      return null;
    }).filter(Boolean);
  }

  return formatted;
}

/**
 * Formate un contact pour l'affichage
 */
function formatContact(contact: any): any {
  if (!contact) return null;

  const formatted: any = {};

  if (contact.firstname || contact.lastname) {
    formatted.nom = `${contact.firstname || ''} ${contact.lastname || ''}`.trim();
  }
  if (contact.email) formatted.email = contact.email;
  if (contact.phone) formatted.telephone = contact.phone;
  if (contact.cellPhone) formatted.mobile = contact.cellPhone;
  if (contact.function) formatted.fonction = contact.function;

  return formatted;
}

/**
 * Formate une adresse pour l'affichage
 */
function formatAddress(address: any): any {
  if (!address) return null;

  const formatted: any = {};

  if (address.street) formatted.rue = address.street;
  if (address.postalCode) formatted.codePostal = address.postalCode;
  if (address.city) formatted.ville = address.city;
  if (address.country) formatted.pays = address.country;

  // Construire l'adresse complète
  const parts: string[] = [];
  if (address.street) parts.push(address.street);
  if (address.postalCode && address.city) {
    parts.push(`${address.postalCode} ${address.city}`);
  }
  if (address.country) parts.push(address.country);
  if (parts.length > 0) {
    formatted.adresseComplete = parts.join(', ');
  }

  return formatted;
}

/**
 * Formate les données pour une réponse lisible
 */
export function formatDataForResponse(data: any): any {
  if (!data) return data;

  // Si c'est un tableau
  if (Array.isArray(data)) {
    if (data.length === 0) return [];

    // Détecter le type d'entité
    const firstItem = data[0];
    if (!firstItem) return [];
    
    if (firstItem.type && (firstItem.type === 'INDIVIDUAL' || firstItem.type === 'PROFESSIONAL' || firstItem.type === 'PUBLIC_ENTITY')) {
      return data.map((item) => item ? formatCustomer(item) : null).filter(Boolean);
    }
    if (firstItem.type?.code || firstItem.state) {
      return data.map(formatDocument);
    }
    if (firstItem.designation && firstItem.prix !== undefined && !firstItem.lignesOuvrage) {
      return data.map(formatArticle);
    }
    if (firstItem.designation && firstItem.lignesOuvrage) {
      return data.map(formatOuvrage);
    }
    if (firstItem.name && (firstItem.families || firstItem.articles)) {
      return data.map(formatCatalog);
    }
    if (firstItem.name && firstItem.siret) {
      return data.map(formatCompany);
    }
    if (firstItem.email && (firstItem.firstname || firstItem.lastname)) {
      return data.map(formatContact);
    }
    if (firstItem.street || firstItem.postalCode) {
      return data.map(formatAddress);
    }
    if (firstItem.email && firstItem.firstname && firstItem.idTenant) {
      return data.map(formatUser);
    }

    // Par défaut, supprimer les IDs
    return data.map((item) => removeIds(item));
  }

  // Si c'est un objet unique
  if (typeof data === 'object') {
    // Détecter le type
    if (data.type && (data.type === 'INDIVIDUAL' || data.type === 'PROFESSIONAL' || data.type === 'PUBLIC_ENTITY')) {
      return formatCustomer(data);
    }
    if (data.type?.code || data.state) {
      return formatDocument(data);
    }
    if (data.designation && data.prix !== undefined && !data.lignesOuvrage) {
      return formatArticle(data);
    }
    if (data.designation && data.lignesOuvrage) {
      return formatOuvrage(data);
    }
    if (data.name && (data.families || data.articles)) {
      return formatCatalog(data);
    }
    if (data.name && data.siret) {
      return formatCompany(data);
    }
    if (data.email && (data.firstname || data.lastname)) {
      return formatContact(data);
    }
    if (data.street || data.postalCode) {
      return formatAddress(data);
    }
    if (data.email && data.firstname && data.idTenant) {
      return formatUser(data);
    }

    // Par défaut, supprimer les IDs
    return removeIds(data);
  }

  return data;
}

/**
 * Convertit les données formatées en JSON lisible
 */
export function formatResponseAsJson(data: any): string {
  if (data === undefined || data === null) {
    return JSON.stringify([]);
  }
  
  try {
    const formatted = formatDataForResponse(data);
    return JSON.stringify(formatted, null, 2);
  } catch (error) {
    // En cas d'erreur, retourner un tableau vide plutôt que de planter
    return JSON.stringify([]);
  }
}

