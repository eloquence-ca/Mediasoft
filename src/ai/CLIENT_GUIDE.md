# Guide d'intégration côté client - Module IA

Ce guide explique comment intégrer le module IA dans votre application cliente.

## Structure de la réponse

Toutes les réponses suivent une structure cohérente et typée :

### Réponse de succès

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

### Réponse d'erreur

```json
{
  "success": false,
  "error": "Message d'erreur explicite",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Exemple d'intégration (JavaScript/TypeScript)

### Utilisation basique

```typescript
async function chatWithAI(message: string): Promise<void> {
  try {
    const response = await fetch('/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yourToken}`,
      },
      body: JSON.stringify({ message }),
    });

    const data: ChatResponseDto = await response.json();

    if (data.success) {
      console.log('Réponse:', data.answer);
      console.log('Temps de traitement:', data.metadata?.processingTime, 'ms');
    } else {
      console.error('Erreur:', data.error);
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
  }
}
```

### Utilisation avec React

```tsx
import { useState } from 'react';

interface ChatResponse {
  success: boolean;
  answer?: string;
  error?: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    processingTime?: number;
  };
}

function ChatComponent() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const data: ChatResponse = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: 'Erreur de connexion',
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Posez votre question..."
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Envoi...' : 'Envoyer'}
      </button>

      {response && (
        <div>
          {response.success ? (
            <div className="success">
              <p>{response.answer}</p>
              {response.metadata && (
                <small>
                  Traité en {response.metadata.processingTime}ms
                </small>
              )}
            </div>
          ) : (
            <div className="error">
              <p>Erreur: {response.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Gestion des erreurs

### Types d'erreurs possibles

1. **Erreur de validation** : Message vide
   ```json
   {
     "success": false,
     "error": "Le message ne peut pas être vide"
   }
   ```

2. **Erreur de configuration** : API non configurée
   ```json
   {
     "success": false,
     "error": "Agent IA non initialisé. Vérifiez la configuration GOOGLE_API_KEY."
   }
   ```

3. **Erreur API** : Clé API invalide
   ```json
   {
     "success": false,
     "error": "Clé API invalide ou expirée. Veuillez vérifier votre configuration."
   }
   ```

4. **Erreur réseau** : Problème de connexion
   - Gérer avec try/catch dans votre code client

## Bonnes pratiques

1. **Toujours vérifier `success`** avant d'utiliser `answer`
2. **Afficher les erreurs** de manière claire à l'utilisateur
3. **Gérer le loading** pendant le traitement
4. **Utiliser les métadonnées** pour afficher des informations utiles (temps de traitement, modèle utilisé)
5. **Valider côté client** avant d'envoyer (message non vide)

## Types TypeScript

Si vous utilisez TypeScript, vous pouvez importer les types :

```typescript
// Définissez ces types dans votre projet client
interface ChatResponseDto {
  success: boolean;
  answer?: string;
  error?: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokensUsed?: number;
    processingTime?: number;
  };
}

interface ChatDto {
  message: string;
}
```

## Exemple complet avec gestion d'erreurs

```typescript
class AIClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async chat(message: string): Promise<ChatResponseDto> {
    // Validation côté client
    if (!message || message.trim().length === 0) {
      return {
        success: false,
        error: 'Le message ne peut pas être vide',
        timestamp: new Date(),
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponseDto = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion',
        timestamp: new Date(),
      };
    }
  }
}

// Utilisation
const aiClient = new AIClient('https://dev-cluster-api.bati-com.fr', 'your-token');
const result = await aiClient.chat('Affiche-moi tous les clients');

if (result.success) {
  console.log(result.answer);
} else {
  console.error(result.error);
}
```

