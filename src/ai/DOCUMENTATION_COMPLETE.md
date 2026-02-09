# 📚 Documentation Complète - Module IA Grappe Backend

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Configuration](#configuration)
4. [Fonctionnement](#fonctionnement)
5. [Ajouter de nouveaux outils](#ajouter-de-nouveaux-outils)
6. [Ajouter de nouvelles fonctionnalités](#ajouter-de-nouvelles-fonctionnalités)
7. [Exemples pratiques](#exemples-pratiques)
8. [Dépannage](#dépannage)
9. [Références](#références)

---

## 🎯 Vue d'ensemble

Le module IA permet aux utilisateurs d'interagir avec leurs données en langage naturel. Il utilise **LangChain** avec **Google Gemini** pour comprendre les questions et utiliser des outils pour récupérer et formater les données.

### Fonctionnalités principales

- ✅ **Communication en langage naturel** : Posez des questions comme vous parleriez à un collègue
- ✅ **Multi-tenant** : Filtrage automatique des données par tenant
- ✅ **Formatage intelligent** : Les réponses sont formatées sans IDs techniques
- ✅ **Gestion d'erreurs robuste** : Messages d'erreur clairs et utiles
- ✅ **Extensible** : Facile d'ajouter de nouveaux outils et fonctionnalités

---

## 🏗️ Architecture

### Structure des fichiers

```
src/ai/
├── ai.module.ts                    # Module NestJS principal
├── ai.service.ts                   # Service principal avec la logique de l'agent
├── ai.controller.ts                # Contrôleur REST pour les endpoints
├── dto/
│   ├── chat.dto.ts                # DTO pour les requêtes de chat
│   └── chat-response.dto.ts       # DTO pour les réponses
├── prompts/
│   └── system-prompt.ts           # Prompt système pour l'agent IA
├── tools/
│   ├── grappe-tools.ts            # Outils LangChain pour interagir avec les données
│   └── analytics-tools.ts         # Outils d'analyse (pour extension future)
├── helpers/
│   ├── error-handler.helper.ts    # Gestion des erreurs
│   ├── format-response.helper.ts  # Formatage des réponses (suppression IDs)
│   └── response-extractor.helper.ts # Extraction des réponses LangChain
├── README.md                       # Documentation de base
├── PROMPTS_EXAMPLES.md             # Liste des prompts possibles
├── CLIENT_GUIDE.md                 # Guide d'intégration client
└── DOCUMENTATION_COMPLETE.md       # Cette documentation
```

### Flux de données

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │ POST /ai/chat
       │ { message: "...", tenantId: "..." }
       ▼
┌─────────────────┐
│ AiController    │
│ - Authentifie   │
│ - Valide        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   AiService     │
│ - Initialise    │
│   l'agent       │
│ - Exécute       │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  LangChain      │
│  Agent          │
│ - Analyse       │
│ - Choisit outils│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Grappe Tools   │
│ - search_customers
│ - search_devis  │
│ - etc.          │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Services      │
│ - CustomerService
│ - DocumentService
│ - etc.          │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Base de       │
│   données       │
└─────────────────┘
```

### Technologies utilisées

- **LangChain.js** : Framework pour créer des agents IA
- **Google Gemini** : Modèle de langage (gemini-2.5-flash-lite)
- **NestJS** : Framework backend
- **TypeScript** : Langage de programmation

---

## ⚙️ Configuration

### 1. Variables d'environnement

Créez ou modifiez votre fichier `.env` à la racine du projet :

```env
# Google Gemini API
GOOGLE_API_KEY=votre_cle_api_google_ici
GOOGLE_MODEL=gemini-2.5-flash-lite
```

**⚠️ IMPORTANT :**
- Ne jamais hardcoder la clé API dans le code
- Utiliser toujours les variables d'environnement
- Obtenir une clé sur [Google AI Studio](https://makersuite.google.com/app/apikey)
- Si la clé est compromise, en créer une nouvelle immédiatement

### 2. Configuration du module

Le fichier `src/config/ai.config.ts` contient la configuration :

```typescript
export const aiConfig = {
  apiKey: process.env.GOOGLE_API_KEY || 'your-google-api-key',
  modelName: process.env.GOOGLE_MODEL || 'gemini-2.5-flash-lite',
  temperature: 0.7,  // 0 = déterministe, 1 = créatif
  maxTokens: 1000,    // Nombre maximum de tokens dans la réponse
};
```

**Paramètres :**
- `apiKey` : Clé API Google Gemini (depuis .env)
- `modelName` : Modèle à utiliser (gemini-2.5-flash-lite par défaut)
- `temperature` : Contrôle la créativité (0.7 = équilibré)
- `maxTokens` : Limite la longueur des réponses

### 3. Dépendances

Assurez-vous d'avoir installé les dépendances :

```bash
npm install @langchain/google-genai langchain
```

### 4. Module NestJS

Le module `AiModule` doit être importé dans `app.module.ts` :

```typescript
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // ... autres modules
    AiModule,
  ],
})
export class AppModule {}
```

---

## 🔄 Fonctionnement

### 1. Initialisation de l'agent

Lorsqu'un utilisateur envoie un message, `AiService` :

1. **Vérifie la configuration** : S'assure que la clé API est présente
2. **Importe LangChain** : Charge dynamiquement les modules nécessaires
3. **Initialise le modèle** : Crée une instance de `ChatGoogleGenerativeAI`
4. **Crée les outils** : Appelle `createGrappeTools()` avec les services et `tenantId`
5. **Crée l'agent** : Utilise `createAgent()` de LangChain avec le modèle et les outils

### 2. Traitement d'une requête

```
1. Utilisateur envoie : "Liste tous mes clients"
   ↓
2. AiController reçoit la requête
   - Authentifie l'utilisateur (JWT)
   - Extrait userId et tenantId
   ↓
3. AiService.chat() est appelé
   - Initialise l'agent pour cet utilisateur
   - Exécute agent.invoke() avec le message
   ↓
4. LangChain Agent analyse le message
   - Comprend l'intention
   - Sélectionne l'outil approprié (search_customers)
   ↓
5. L'outil est exécuté
   - Appelle CustomerService.findAllByTenant()
   - Filtre par tenantId
   - Formate les données (supprime IDs)
   ↓
6. L'agent formate la réponse
   - Utilise le prompt système
   - Structure la réponse de manière lisible
   ↓
7. La réponse est retournée au client
   - Format JSON structuré
   - Avec métadonnées (temps de traitement, modèle)
```

### 3. Filtrage multi-tenant

Tous les outils reçoivent le `tenantId` en paramètre et filtrent automatiquement :

```typescript
// Exemple dans search_customers
const result = await customerService.findAll({ page: 1, limit: 1000 });
const allCustomers = result.data.filter(
  (c) => c.directory?.idTenant === tenantId
);
```

### 4. Formatage des réponses

Les réponses sont formatées pour :
- ✅ Supprimer tous les IDs techniques
- ✅ Formater les montants (ex: "1 234,56 €")
- ✅ Structurer les données de manière lisible
- ✅ Utiliser des noms métier au lieu d'IDs

Voir `helpers/format-response.helper.ts` pour les détails.

### 5. Gestion des erreurs

Tous les outils utilisent `handleToolError()` pour :
- ✅ Capturer les exceptions
- ✅ Nettoyer les messages d'erreur
- ✅ Supprimer les IDs des messages d'erreur
- ✅ Retourner des messages clairs pour l'utilisateur

Voir `helpers/error-handler.helper.ts` pour les détails.

---

## 🛠️ Ajouter de nouveaux outils

### Étape 1 : Créer l'outil dans `grappe-tools.ts`

Ouvrez `src/ai/tools/grappe-tools.ts` et ajoutez votre outil dans le tableau retourné par `createGrappeTools()` :

```typescript
import { tool } from 'langchain';
import { formatResponseAsJson } from '../helpers/format-response.helper';
import { handleToolError } from '../helpers/error-handler.helper';
import { NotFoundException } from '@nestjs/common';

export function createGrappeTools(
  // ... services existants
  yourService: YourService,  // Ajoutez votre service
  tenantId: string,
) {
  return [
    // ... outils existants
    
    // Nouvel outil
    tool(
      async ({ param1, param2 }: {
        param1?: string;
        param2?: number;
      }) => {
        try {
          // Validation des paramètres
          if (param1 && param1.trim().length === 0) {
            return 'Paramètre invalide.';
          }

          // Appel au service
          let result;
          try {
            result = await yourService.findSomething(param1, tenantId);
          } catch (error) {
            if (error instanceof NotFoundException) {
              return 'Élément non trouvé.';
            }
            throw error;
          }

          // Vérification des résultats
          if (!result || (Array.isArray(result) && result.length === 0)) {
            return 'Aucun résultat trouvé.';
          }

          // Formatage et retour
          return formatResponseAsJson(result);
        } catch (error: any) {
          return handleToolError(error, 'récupérer les données');
        }
      },
      {
        name: 'search_something',
        description:
          'Description claire de ce que fait l\'outil. Utilise cet outil quand l\'utilisateur demande [exemple de question].',
        schema: {
          type: 'object',
          properties: {
            param1: {
              type: 'string',
              description: 'Description du paramètre 1',
            },
            param2: {
              type: 'number',
              description: 'Description du paramètre 2',
            },
          },
        },
      },
    ),
  ];
}
```

### Étape 2 : Ajouter le service dans `ai.module.ts`

Si vous utilisez un nouveau service, ajoutez-le dans les imports :

```typescript
import { YourModule } from '../your/your.module';

@Module({
  imports: [
    CustomerModule,
    CatalogModule,
    CompanyModule,
    DocumentModule,
    YourModule,  // Ajoutez votre module
  ],
  // ...
})
export class AiModule {}
```

### Étape 3 : Injecter le service dans `ai.service.ts`

```typescript
import { YourService } from '../your/your.service';

@Injectable()
export class AiService {
  constructor(
    // ... services existants
    private readonly yourService: YourService,  // Ajoutez votre service
  ) {}

  private async initializeAgent(userId: string, tenantId: string) {
    // ...
    const tools = createGrappeTools(
      this.customerService,
      this.catalogService,
      this.catalogMergeService,
      this.companyService,
      this.documentService,
      this.yourService,  // Passez votre service
      tenantId,
    );
    // ...
  }
}
```

### Étape 4 : Mettre à jour le prompt système

Modifiez `src/ai/prompts/system-prompt.ts` pour documenter le nouvel outil :

```typescript
📊 OUTILS DISPONIBLES:

// ... outils existants

🔧 NOUVEL OUTIL:
- search_something: Description de ce que fait l'outil. Utilise cet outil quand...
```

### Étape 5 : Tester

Testez votre nouvel outil avec des questions comme :
- "Liste tous les [éléments]"
- "Trouve [quelque chose]"
- "Montre-moi [données]"

---

## 🚀 Ajouter de nouvelles fonctionnalités

### Ajouter un nouveau type de recherche

Exemple : Ajouter la recherche de factures

1. **Créer l'outil** dans `grappe-tools.ts` :

```typescript
tool(
  async ({ documentId, customerId, companyId }: {
    documentId?: string;
    customerId?: string;
    companyId?: string;
  }) => {
    try {
      if (documentId) {
        const document = await documentService.findOne(documentId);
        if (document.idTenant !== tenantId) {
          return 'Facture non accessible pour ce tenant.';
        }
        if (document.type?.code !== DOCUMENT_TYPE.FACTURE) {
          return 'Ce document n\'est pas une facture.';
        }
        return formatResponseAsJson(document);
      }
      
      const result = await documentService.findAll(tenantId, 1, 100);
      const factures = result.documents.filter(
        (doc) => doc.type?.code === DOCUMENT_TYPE.FACTURE
      );
      
      if (customerId) {
        const filtered = factures.filter(
          (doc) => doc.idCustomer === customerId
        );
        return formatResponseAsJson(filtered);
      }
      
      return formatResponseAsJson(factures);
    } catch (error: any) {
      return handleToolError(error, 'récupérer les factures');
    }
  },
  {
    name: 'search_factures',
    description: 'Rechercher des factures...',
    schema: { /* ... */ },
  },
),
```

2. **Mettre à jour le prompt système** pour inclure le nouvel outil

3. **Ajouter des exemples** dans `PROMPTS_EXAMPLES.md`

### Ajouter un formatage personnalisé

Si vous avez besoin d'un formatage spécifique, modifiez `helpers/format-response.helper.ts` :

```typescript
/**
 * Formate un nouvel élément pour l'affichage
 */
function formatNewElement(element: any): any {
  if (!element) return null;

  const formatted: any = {};
  
  // Ajoutez vos champs formatés
  if (element.name) formatted.nom = element.name;
  if (element.price) formatted.prix = formatAmount(element.price);
  
  return formatted;
}

// Ajoutez la détection dans formatDataForResponse()
if (firstItem.newField) {
  return data.map(formatNewElement);
}
```

### Ajouter une validation personnalisée

Créez une fonction de validation dans `helpers/error-handler.helper.ts` :

```typescript
/**
 * Valide un paramètre spécifique
 */
export function validateCustomParam(param: any): string | null {
  if (!param || typeof param !== 'string') {
    return 'Paramètre invalide.';
  }
  if (param.trim().length === 0) {
    return 'Paramètre vide.';
  }
  // Ajoutez vos validations spécifiques
  return null; // null = valide
}
```

---

## 💡 Exemples pratiques

### Exemple 1 : Ajouter la recherche de paiements

```typescript
// 1. Dans grappe-tools.ts
tool(
  async ({ paymentId, customerId }: {
    paymentId?: string;
    customerId?: string;
  }) => {
    try {
      if (paymentId) {
        const payment = await paymentService.findOne(paymentId);
        if (payment.idTenant !== tenantId) {
          return 'Paiement non accessible.';
        }
        return formatResponseAsJson(payment);
      }
      
      if (customerId) {
        const payments = await paymentService.findByCustomer(customerId, tenantId);
        return formatResponseAsJson(payments);
      }
      
      const payments = await paymentService.findAll(tenantId);
      return formatResponseAsJson(payments);
    } catch (error: any) {
      return handleToolError(error, 'récupérer les paiements');
    }
  },
  {
    name: 'search_payments',
    description: 'Rechercher des paiements par ID, client ou lister tous les paiements.',
    schema: {
      type: 'object',
      properties: {
        paymentId: {
          type: 'string',
          description: 'Identifiant technique d\'un paiement spécifique',
        },
        customerId: {
          type: 'string',
          description: 'Identifiant technique du client pour filtrer les paiements',
        },
      },
    },
  },
),
```

### Exemple 2 : Ajouter un calcul personnalisé

```typescript
tool(
  async ({ customerId }: { customerId: string }) => {
    try {
      if (!customerId || customerId.trim().length === 0) {
        return 'Identifiant de client invalide.';
      }

      // Récupérer les données
      const devis = await documentService.findByCustomer(customerId, DOCUMENT_TYPE.DEVIS);
      const commandes = await documentService.findByCustomer(customerId, DOCUMENT_TYPE.COMMANDE);
      
      // Calculer
      const totalDevis = devis.reduce((sum, d) => sum + (d.totalTTC || 0), 0);
      const totalCommandes = commandes.reduce((sum, c) => sum + (c.totalTTC || 0), 0);
      
      // Formater
      return formatResponseAsJson({
        nombreDevis: devis.length,
        nombreCommandes: commandes.length,
        totalDevis: formatAmount(totalDevis),
        totalCommandes: formatAmount(totalCommandes),
      });
    } catch (error: any) {
      return handleToolError(error, 'calculer les statistiques');
    }
  },
  {
    name: 'calculate_customer_stats',
    description: 'Calculer les statistiques d\'un client (nombre de devis, commandes, montants).',
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          description: 'Identifiant technique du client',
        },
      },
      required: ['customerId'],
    },
  },
),
```

---

## 🔧 Dépannage

### Problème : "Agent IA non initialisé"

**Cause :** Clé API manquante ou invalide

**Solution :**
1. Vérifiez que `GOOGLE_API_KEY` est défini dans `.env`
2. Vérifiez que la clé est valide sur [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Redémarrez l'application après modification du `.env`

### Problème : "Impossible d'importer les modules LangChain"

**Cause :** Dépendances non installées

**Solution :**
```bash
npm install @langchain/google-genai langchain
```

### Problème : "Timeout: La requête a pris trop de temps"

**Cause :** Requête trop complexe ou service lent

**Solution :**
1. Simplifiez la question
2. Augmentez le timeout dans `ai.service.ts` (ligne ~140)
3. Vérifiez la performance des services appelés

### Problème : "Limite de requêtes atteinte"

**Cause :** Quota API Google dépassé

**Solution :**
1. Attendez quelques minutes
2. Vérifiez votre quota sur [Google Cloud Console](https://console.cloud.google.com/)
3. Considérez l'upgrade de votre plan API

### Problème : Les IDs apparaissent dans les réponses

**Cause :** Formatage non appliqué

**Solution :**
1. Vérifiez que vous utilisez `formatResponseAsJson()` dans vos outils
2. Vérifiez que `format-response.helper.ts` est correctement configuré
3. Vérifiez que le prompt système interdit les IDs

### Problème : Données d'un autre tenant

**Cause :** Filtrage par tenant non appliqué

**Solution :**
1. Vérifiez que `tenantId` est passé à `createGrappeTools()`
2. Vérifiez que tous les outils filtrent par `tenantId`
3. Vérifiez que les services respectent le filtrage multi-tenant

---

## 📖 Références

### Documentation externe

- [LangChain.js Documentation](https://js.langchain.com/)
- [Google Gemini API](https://ai.google.dev/docs)
- [NestJS Documentation](https://docs.nestjs.com/)

### Fichiers de documentation internes

- `README.md` : Documentation de base
- `PROMPTS_EXAMPLES.md` : Liste complète des prompts possibles
- `CLIENT_GUIDE.md` : Guide d'intégration pour le frontend

### Fichiers de code importants

- `ai.service.ts` : Logique principale de l'agent
- `grappe-tools.ts` : Définition de tous les outils
- `system-prompt.ts` : Instructions pour l'agent IA
- `format-response.helper.ts` : Formatage des réponses
- `error-handler.helper.ts` : Gestion des erreurs

---

## ✅ Checklist pour ajouter un nouvel outil

- [ ] Créer l'outil dans `grappe-tools.ts`
- [ ] Utiliser `formatResponseAsJson()` pour formater les réponses
- [ ] Utiliser `handleToolError()` pour gérer les erreurs
- [ ] Valider tous les paramètres d'entrée
- [ ] Filtrer par `tenantId` si nécessaire
- [ ] Gérer les cas `null`/`undefined`/tableaux vides
- [ ] Ajouter le service dans `ai.module.ts` si nouveau
- [ ] Injecter le service dans `ai.service.ts`
- [ ] Passer le service à `createGrappeTools()`
- [ ] Mettre à jour le prompt système
- [ ] Ajouter des exemples dans `PROMPTS_EXAMPLES.md`
- [ ] Tester avec plusieurs questions
- [ ] Vérifier que les IDs ne sont pas exposés
- [ ] Vérifier le filtrage multi-tenant

---

## 🎓 Bonnes pratiques

1. **Toujours filtrer par tenantId** : La sécurité multi-tenant est primordiale
2. **Utiliser les helpers** : `formatResponseAsJson()` et `handleToolError()` sont vos amis
3. **Valider les entrées** : Vérifiez toujours les paramètres avant de les utiliser
4. **Messages d'erreur clairs** : Les utilisateurs ne doivent jamais voir d'IDs techniques
5. **Documenter les outils** : Descriptions claires dans le prompt système
6. **Tester exhaustivement** : Testez avec différents cas (vide, null, erreurs)
7. **Performance** : Limitez les résultats (pagination) pour éviter les timeouts

---

*Dernière mise à jour : 2024*

