# 🔍 Approche Utilisée : LangChain Tools (Ni RAG, Ni MCP)

## 📊 Résumé

**Approche utilisée :** **LangChain Tools** (Outils LangChain)

**❌ Non utilisé :** RAG (Retrieval Augmented Generation)  
**❌ Non utilisé :** MCP (Model Context Protocol)

---

## ✅ Ce qui est utilisé : LangChain Tools

### Qu'est-ce que LangChain Tools ?

Les **LangChain Tools** sont des fonctions que l'agent IA peut appeler pour interagir avec des systèmes externes (base de données, APIs, services). C'est une approche de **function calling** où l'agent décide dynamiquement quels outils utiliser en fonction de la question de l'utilisateur.

### Comment ça fonctionne dans notre implémentation ?

```
1. Utilisateur pose une question
   ↓
2. LangChain Agent analyse la question
   ↓
3. Agent sélectionne l'outil approprié (ex: search_customers)
   ↓
4. L'outil est exécuté → Appelle un service NestJS
   ↓
5. Le service interroge la base de données
   ↓
6. Les données sont formatées et retournées à l'agent
   ↓
7. L'agent formate la réponse finale pour l'utilisateur
```

### Code dans notre implémentation

```typescript
// src/ai/tools/grappe-tools.ts
import { tool } from 'langchain';

export function createGrappeTools(
  customerService: CustomerService,
  // ... autres services
  tenantId: string,
) {
  return [
    // Outil LangChain
    tool(
      async ({ customerId }: { customerId: string }) => {
        // Appel direct au service NestJS
        const customer = await customerService.findOne(customerId);
        // Formatage et retour
        return formatResponseAsJson(customer);
      },
      {
        name: 'search_customers',
        description: 'Rechercher des clients...',
        schema: { /* schéma JSON pour l'agent */ },
      },
    ),
  ];
}
```

```typescript
// src/ai/ai.service.ts
const tools = createGrappeTools(/* services */, tenantId);

// Création de l'agent avec les outils
const agent = createAgent({
  model,
  tools,  // ← Les outils LangChain
  systemPrompt: SYSTEM_PROMPT,
});
```

---

## ❌ Pourquoi pas RAG ?

### Qu'est-ce que RAG ?

**RAG (Retrieval Augmented Generation)** est une approche qui :
1. Crée des embeddings (vecteurs) des documents
2. Stocke ces embeddings dans une base de données vectorielle
3. Lors d'une question, recherche les documents similaires
4. Injecte ces documents dans le contexte du LLM
5. Le LLM génère une réponse basée sur ces documents

### Pourquoi on ne l'utilise pas ?

❌ **Pas de base de données vectorielle** : On n'utilise pas de base comme Pinecone, Weaviate, ou Chroma  
❌ **Pas d'embeddings** : On ne crée pas de vecteurs des données  
❌ **Pas de recherche sémantique** : On ne fait pas de recherche par similarité  
❌ **Accès direct aux données** : On interroge directement la base de données PostgreSQL via les services NestJS

### Quand utiliser RAG ?

RAG serait utile si :
- Vous avez beaucoup de documents non structurés (PDFs, textes longs)
- Vous voulez rechercher par similarité sémantique
- Vous avez besoin de contexte historique ou de documentation
- Les données changent fréquemment et vous voulez éviter de réentraîner le modèle

### Notre cas d'usage

✅ **Données structurées** : Clients, devis, commandes sont dans une base de données structurée  
✅ **Requêtes précises** : On veut des données exactes, pas des similarités  
✅ **Accès direct** : Les services NestJS fournissent déjà des méthodes de recherche précises  
✅ **Temps réel** : Les données sont toujours à jour, pas besoin de les indexer

---

## ❌ Pourquoi pas MCP ?

### Qu'est-ce que MCP ?

**MCP (Model Context Protocol)** est un protocole développé par Anthropic pour standardiser la communication entre les LLMs et les outils externes. C'est une spécification pour créer des serveurs d'outils que les LLMs peuvent appeler.

### Pourquoi on ne l'utilise pas ?

❌ **Pas de serveur MCP** : On n'a pas de serveur MCP qui expose les outils  
❌ **LangChain natif** : On utilise directement les outils LangChain, pas le protocole MCP  
❌ **Pas de standardisation MCP** : Les outils sont définis directement dans LangChain

### Quand utiliser MCP ?

MCP serait utile si :
- Vous voulez standardiser l'accès aux outils
- Vous avez plusieurs applications qui doivent partager les mêmes outils
- Vous voulez une architecture plus découplée
- Vous utilisez des modèles Anthropic (Claude) qui supportent nativement MCP

### Notre cas d'usage

✅ **LangChain suffit** : Les outils LangChain sont parfaitement adaptés à nos besoins  
✅ **Intégration directe** : Pas besoin d'une couche de protocole supplémentaire  
✅ **Google Gemini** : On utilise Google Gemini qui fonctionne bien avec LangChain Tools

---

## 📊 Comparaison des approches

| Caractéristique | LangChain Tools (Notre approche) | RAG | MCP |
|----------------|----------------------------------|-----|-----|
| **Type de données** | Structurées (BDD) | Non structurées (documents) | Structurées ou non |
| **Recherche** | Précise (requêtes SQL) | Sémantique (similarité) | Dépend de l'implémentation |
| **Base vectorielle** | ❌ Non | ✅ Oui | ❌ Non (mais possible) |
| **Temps réel** | ✅ Oui | ⚠️ Dépend de l'indexation | ✅ Oui |
| **Complexité** | Faible | Moyenne à élevée | Moyenne |
| **Performance** | Rapide (requêtes directes) | Plus lent (recherche + génération) | Rapide |
| **Mise à jour** | Immédiate | Nécessite réindexation | Immédiate |

---

## 🎯 Avantages de notre approche (LangChain Tools)

### ✅ Simplicité
- Pas besoin de base vectorielle
- Pas besoin d'embeddings
- Intégration directe avec les services existants

### ✅ Performance
- Requêtes directes à la base de données
- Pas de recherche vectorielle coûteuse
- Réponses rapides

### ✅ Précision
- Données exactes, pas de similarité approximative
- Filtrage multi-tenant garanti
- Validation des données via les services NestJS

### ✅ Maintenance
- Code simple et compréhensible
- Facile à déboguer
- Facile à étendre avec de nouveaux outils

### ✅ Temps réel
- Données toujours à jour
- Pas de délai d'indexation
- Synchronisation automatique

---

## 🔄 Comment migrer vers RAG (si nécessaire)

Si vous voulez ajouter RAG pour des cas d'usage spécifiques :

1. **Installer les dépendances** :
```bash
npm install @langchain/openai @langchain/community
npm install chromadb # ou pinecone, weaviate, etc.
```

2. **Créer un outil RAG** :
```typescript
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai/embeddings';

const vectorStore = new Chroma(/* config */);

tool(
  async ({ query }: { query: string }) => {
    const results = await vectorStore.similaritySearch(query, 5);
    return formatResponseAsJson(results);
  },
  {
    name: 'search_documents',
    description: 'Rechercher dans les documents par similarité sémantique',
  },
),
```

3. **Ajouter l'outil à createGrappeTools()**

---

## 🔄 Comment migrer vers MCP (si nécessaire)

Si vous voulez utiliser MCP :

1. **Créer un serveur MCP** qui expose vos outils
2. **Utiliser un client MCP** dans LangChain
3. **Adapter les outils** pour suivre le protocole MCP

Cependant, pour notre cas d'usage, **LangChain Tools est la meilleure solution**.

---

## 📚 Références

- [LangChain Tools Documentation](https://js.langchain.com/docs/modules/tools/)
- [RAG Documentation](https://js.langchain.com/docs/use_cases/question_answering/)
- [MCP Specification](https://modelcontextprotocol.io/)

---

## ✅ Conclusion

**Notre implémentation utilise LangChain Tools**, qui est :
- ✅ Parfait pour les données structurées
- ✅ Simple à maintenir
- ✅ Performant
- ✅ Précis
- ✅ Adapté à notre architecture NestJS

**RAG et MCP ne sont pas nécessaires** pour notre cas d'usage actuel, mais peuvent être ajoutés si besoin à l'avenir.

---

*Dernière mise à jour : 2024*

