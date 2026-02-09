#!/bin/bash
# Script de test pour l'API AI
# Usage: ./test-ai.sh <endpoint> <token>

# Configuration
API_BASE="http://localhost:5050"
ENDPOINT=$1
TOKEN=$2

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Test API AI ===${NC}\n"

# Test login pour obtenir un token
if [ -z "$TOKEN" ]; then
    echo -e "${BLUE}1. Connexion pour obtenir un token...${NC}\n"
    echo "Entrez votre email:"
    read EMAIL
    echo "Entrez votre mot de passe:"
    read -s PASSWORD
    
    echo -e "\n\n${BLUE}Connexion...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}Erreur de connexion: $LOGIN_RESPONSE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Token obtenu!${NC}\n"
fi

echo -e "${BLUE}Token: ${TOKEN:0:50}...${NC}\n"

# Test santé
echo -e "${BLUE}2. Test de l'endpoint AI...${NC}\n"

if [ "$ENDPOINT" == "stream" ]; then
    echo -e "${BLUE}Test streaming (SSE)...${NC}\n"
    curl -N -X POST "$API_BASE/ai/chat/stream" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"message": "Liste mes clients professionnels"}' \
        --max-time 60
else
    echo -e "${BLUE}Test chat standard...${NC}\n"
    curl -s -X POST "$API_BASE/ai/chat" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"message": "Affiche-moi tous les clients professionnels"}' \
        | python3 -m json.tool 2>/dev/null || cat
fi

echo -e "\n\n${GREEN}=== Test terminé ===${NC}"
