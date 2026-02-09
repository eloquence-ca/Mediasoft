export function createCorsOriginValidator() {
  // Configuration des origins autorisées depuis l'environnement
  const rawOrigins = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (origin: string | undefined, callback: (error: Error | null, success?: boolean) => void) => {
    // Permettre les requêtes sans origin (Postman, applications mobiles, serveur-à-serveur)
    if (!origin) {
      return callback(null, true);
    }

    // 1. Vérifier les origins explicitement autorisées dans ALLOWED_ORIGINS
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // 2. Autoriser tous les sous-domaines de daxium-air.com
    if (/^https:\/\/.*\.bati-com\.fr$/.test(origin)) {
      return callback(null, true);
    }

    // 3. En développement, autoriser localhost et 127.0.0.1 avec n'importe quel port
    if (process.env.NODE_ENV === 'development') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
    }

    // 4. Rejeter toutes les autres origins
    const error = new Error(`CORS policy violation: Origin ${origin} not allowed`);
    callback(error, false);
  };
}