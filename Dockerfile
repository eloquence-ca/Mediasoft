# Utilise une base Debian slim (compatible wkhtmltopdf)
FROM node:20-slim

# Installer wkhtmltopdf et ses dépendances
RUN apt-get update && apt-get install -y \
    wkhtmltopdf \
    fontconfig \
    libfreetype6 \
    libjpeg62-turbo \
    libx11-6 \
    libxcb1 \
    libxext6 \
    libxrender1 \
    xfonts-75dpi \
    xfonts-base \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# Crée le dossier de travail
WORKDIR /app

# Copier les fichiers nécessaires pour l'installation
COPY package*.json ./

# Installer les dépendances Node.js
RUN npm install --legacy-peer-deps

# Copier le reste du code source
COPY . .

# Construire le projet NestJS
RUN npm run build

# Exposer le port
EXPOSE 5050

# Démarrer directement le build compilé
CMD ["npm", "start"]
