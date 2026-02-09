/**
 * Helper pour formater les réponses en texte structuré
 * Optimisé pour être converti en tableaux HTML par le frontend
 */

import { formatDataForResponse } from './format-response.helper';

/**
 * Formate un tableau de données en texte structuré pour l'affichage
 * Format: "• [Colonne1] - [Colonne2] - [Colonne3]"
 */
export function formatDataAsText(data: any): string {
  if (!data) return 'Aucune donnée disponible.';

  const formatted = formatDataForResponse(data);

  // Si c'est un tableau
  if (Array.isArray(formatted)) {
    if (formatted.length === 0) {
      return 'Aucun résultat trouvé.';
    }

    // Détecter le type d'entité et formater en conséquence
    const firstItem = formatted[0];
    
    // Clients
    if (firstItem.type || firstItem.code || firstItem.email) {
      return formatCustomersAsText(formatted);
    }
    
    // Documents (devis, commandes, factures)
    if (firstItem.titre || firstItem.typeCode || firstItem.etat) {
      return formatDocumentsAsText(formatted);
    }
    
    // Articles
    if (firstItem.designation || firstItem.reference || firstItem.prix) {
      return formatArticlesAsText(formatted);
    }
    
    // Ouvrages
    if (firstItem.designation && firstItem.prix !== undefined) {
      return formatOuvragesAsText(formatted);
    }
    
    // Catalogues
    if (firstItem.nom && (firstItem.nombreArticles !== undefined || firstItem.nombreFamilles !== undefined)) {
      return formatCatalogsAsText(formatted);
    }
    
    // Utilisateurs
    if (firstItem.email && firstItem.nom) {
      return formatUsersAsText(formatted);
    }
    
    // Contacts
    if (firstItem.email && (firstItem.prenom || firstItem.nom)) {
      return formatContactsAsText(formatted);
    }
    
    // Par défaut, format générique
    return formatGenericArrayAsText(formatted);
  }

  // Si c'est un objet unique
  if (typeof formatted === 'object') {
    return formatObjectAsText(formatted);
  }

  return String(formatted);
}

/**
 * Formate les clients en texte structuré
 */
function formatCustomersAsText(customers: any[]): string {
  const lines = customers.map((customer) => {
    const parts: string[] = [];
    
    // Nom
    if (customer.nom) parts.push(customer.nom);
    else if (customer.raisonSociale) parts.push(customer.raisonSociale);
    else if (customer.nomEntite) parts.push(customer.nomEntite);
    else parts.push('N/A');
    
    // Type
    if (customer.type) parts.push(customer.type);
    
    // Email
    if (customer.email) parts.push(customer.email);
    
    // Téléphone
    if (customer.telephone) parts.push(customer.telephone);
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate les documents en texte structuré
 */
function formatDocumentsAsText(documents: any[]): string {
  const lines = documents.map((doc) => {
    const parts: string[] = [];
    
    // Code/Titre
    if (doc.code) parts.push(doc.code);
    else if (doc.titre) parts.push(doc.titre);
    else parts.push('N/A');
    
    // Client
    if (doc.client) {
      if (doc.client.nom) parts.push(doc.client.nom);
      else if (doc.client.raisonSociale) parts.push(doc.client.raisonSociale);
      else if (doc.client.nomEntite) parts.push(doc.client.nomEntite);
    }
    
    // Montant TTC
    if (doc.totalTTC) parts.push(doc.totalTTC);
    
    // État
    if (doc.etat) parts.push(doc.etat);
    
    // Type (pour les factures)
    if (doc.typeCode === 'FACTURE_ACOMPTE') parts.push('Facture d\'acompte');
    else if (doc.typeCode === 'FACTURE') parts.push('Facture');
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate les articles en texte structuré
 */
function formatArticlesAsText(articles: any[]): string {
  const lines = articles.map((article) => {
    const parts: string[] = [];
    
    // Désignation
    if (article.designation) parts.push(article.designation);
    else if (article.nom) parts.push(article.nom);
    else parts.push('N/A');
    
    // Référence
    if (article.reference) parts.push(article.reference);
    else if (article.code) parts.push(article.code);
    
    // Prix
    if (article.prix) parts.push(article.prix);
    
    // Unité
    if (article.unite) parts.push(article.unite);
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate les ouvrages en texte structuré
 */
function formatOuvragesAsText(ouvrages: any[]): string {
  const lines = ouvrages.map((ouvrage) => {
    const parts: string[] = [];
    
    // Désignation
    if (ouvrage.designation) parts.push(ouvrage.designation);
    else parts.push('N/A');
    
    // Prix
    if (ouvrage.prix) parts.push(ouvrage.prix);
    
    // Unité
    if (ouvrage.unite) parts.push(ouvrage.unite);
    
    // Catalogue
    if (ouvrage.catalogue) parts.push(ouvrage.catalogue);
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate les catalogues en texte structuré
 */
function formatCatalogsAsText(catalogs: any[]): string {
  const lines = catalogs.map((catalog) => {
    const parts: string[] = [];
    
    // Nom
    if (catalog.nom) parts.push(catalog.nom);
    else parts.push('N/A');
    
    // Nombre d'articles
    if (catalog.nombreArticles !== undefined) {
      parts.push(`${catalog.nombreArticles} articles`);
    }
    
    // Nombre de familles
    if (catalog.nombreFamilles !== undefined) {
      parts.push(`${catalog.nombreFamilles} familles`);
    }
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate les utilisateurs en texte structuré
 */
function formatUsersAsText(users: any[]): string {
  const lines = users.map((user) => {
    const parts: string[] = [];
    
    // Nom
    if (user.nom) parts.push(user.nom);
    else parts.push('N/A');
    
    // Email
    if (user.email) parts.push(user.email);
    
    // Téléphone
    if (user.telephone) parts.push(user.telephone);
    else if (user.mobile) parts.push(user.mobile);
    
    // Statut Admin
    if (user.estAdmin !== undefined) {
      parts.push(`Admin: ${user.estAdmin ? 'Oui' : 'Non'}`);
    }
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate les contacts en texte structuré
 */
function formatContactsAsText(contacts: any[]): string {
  const lines = contacts.map((contact) => {
    const parts: string[] = [];
    
    // Nom complet
    if (contact.nom) parts.push(contact.nom);
    else if (contact.prenom || contact.nom) {
      parts.push(`${contact.prenom || ''} ${contact.nom || ''}`.trim());
    }
    else parts.push('N/A');
    
    // Email
    if (contact.email) parts.push(contact.email);
    
    // Téléphone
    if (contact.telephone) parts.push(contact.telephone);
    
    // Fonction
    if (contact.fonction) parts.push(contact.fonction);
    
    return `• ${parts.join(' - ')}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate un tableau générique en texte structuré
 */
function formatGenericArrayAsText(items: any[]): string {
  const lines = items.map((item) => {
    if (typeof item === 'string') {
      return `• ${item}`;
    }
    
    if (typeof item === 'object') {
      const parts = Object.values(item)
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => String(v));
      return `• ${parts.join(' - ')}`;
    }
    
    return `• ${String(item)}`;
  });
  
  return lines.join('\n');
}

/**
 * Formate un objet unique en texte structuré
 */
function formatObjectAsText(obj: any): string {
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      lines.push(`• ${label}: ${String(value)}`);
    }
  }
  
  return lines.join('\n');
}

