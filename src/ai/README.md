# Module IA - Réplication de agent-ia

Ce module est une réplication exacte de la structure du projet `agent-ia`, adaptée pour Grappe Backend.

> 📚 **Documentation complète** : Consultez [`DOCUMENTATION_COMPLETE.md`](./DOCUMENTATION_COMPLETE.md) pour une documentation exhaustive sur la configuration, le fonctionnement, et comment ajouter de nouveaux outils et fonctionnalités.

## Structure

```
src/ai/
├── ai.module.ts              # Module NestJS
├── ai.service.ts             # Service principal avec l'agent IA
├── ai.controller.ts          # Contrôleur REST
├── dto/
│   └── chat.dto.ts          # DTO pour le chat
├── prompts/
│   └── system-prompt.ts     # Prompt système pour l'agent
└── tools/
    ├── grappe-tools.ts      # Outils pour interagir avec les données Grappe
    └── analytics-tools.ts   # Outils d'analyse (pour extension future)
```

## Configuration

Le fichier `src/config/ai.config.ts` contient la configuration de l'agent IA.

### Variables d'Environment

Ajoutez dans votre fichier `.env` :

```env
# Google Gemini API
GOOGLE_API_KEY=votre_cle_api_google
GOOGLE_MODEL=gemini-2.5-flash-lite

# Redis (pour cache et rate limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
AI_RATE_LIMIT=50
AI_RATE_WINDOW=3600
```

### Docker

Si vous utilisez Docker, Redis est automatiquement configuré dans `compose.yml` :

```bash
docker compose up -d
```

Cela démarre :
- **Redis** sur le port 6379
- **Backend** sur le port 5050

**Important** : 
1. Remplacez `votre_cle_api_google` par votre vraie clé API Google Gemini
2. Vous pouvez obtenir une nouvelle clé sur [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **NE JAMAIS** hardcoder votre clé API dans le code source - utilisez toujours les variables d'environnement
4. Si votre clé API est compromise, créez-en une nouvelle immédiatement

## Utilisation

### Endpoint API

**POST** `/ai/chat`

**Headers:**
```
Authorization: Bearer <votre_token_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Affiche-moi tous les clients de type PROFESSIONAL"
}
```

**Réponse de succès:**
```json
{
  "success": true,
  "answer": "Voici la liste des clients professionnels...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "model": "gemini-2.5-flash-lite",
    "processingTime": 1250
  }
}
```

**Réponse d'erreur:**
```json
{
  "success": false,
  "error": "Message d'erreur explicite",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

> 📖 **Guide d'intégration client** : Consultez `CLIENT_GUIDE.md` pour des exemples d'intégration détaillés.

## Exemples de requêtes

> 📖 **Liste complète des prompts** : Consultez `PROMPTS_EXAMPLES.md` pour une liste exhaustive de tous les prompts possibles organisés par catégorie.

### Recherche de clients
```
"Affiche-moi tous les clients de type PROFESSIONAL"
"Liste tous mes clients"
"Montre-moi les contacts du client [nom]"
"Quelles sont les adresses du client [nom]?"
```

### Recherche de catalogues
```
"Liste tous les catalogues disponibles"
"Montre-moi les articles du catalogue [nom]"
"Quelles sont les familles du catalogue [nom]?"
```

### Recherche d'articles
```
"Trouve tous les articles de la famille [nom]"
"Affiche les détails de l'article [désignation]"
"Liste tous les articles du catalogue [nom]"
```

### Recherche de devis et commandes
```
"Liste tous les devis"
"Quels sont les devis du client [nom] ?"
"Affiche-moi toutes les commandes"
"Montre-moi les commandes de la société [nom]"
```

## Outils disponibles

Les outils sont définis dans `tools/grappe-tools.ts` :

- `search_customers` - Recherche de clients
- `get_customer_contacts` - Contacts d'un client
- `get_customer_addresses` - Adresses d'un client
- `search_catalogs` - Recherche de catalogues
- `search_articles` - Recherche d'articles
- `search_ouvrages` - Recherche d'ouvrages
- `search_families` - Recherche de familles
- `search_companies` - Recherche de sociétés

## Ajouter un nouvel outil

Pour ajouter un nouvel outil, modifiez `tools/grappe-tools.ts` :

```typescript
tool(
  async ({ param1 }: { param1: string }) => {
    try {
      // Votre logique ici
      return JSON.stringify({ result: '...' });
    } catch (error) {
      return `Erreur: ${error.message}`;
    }
  },
  {
    name: 'nom_de_votre_outil',
    description: 'Description de ce que fait l\'outil',
    schema: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: 'Description du paramètre',
        },
      },
      required: ['param1'],
    },
  },
),
```

## Notes

- Le module suit exactement la même structure que `agent-ia`
- Toutes les requêtes nécessitent une authentification JWT
- Les données sont filtrées par tenant (multi-tenant)
- L'agent utilise LangChain avec `createAgent` (nouvelle API)
