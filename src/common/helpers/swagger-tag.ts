import { INestApplication } from '@nestjs/common';

export function addTagsAutomatically(app: INestApplication, document: any) {
  const usedTags = new Set<string>();

  for (const path of Object.keys(document.paths)) {
    for (const method of Object.keys(document.paths[path])) {
      const operationObject = document.paths[path][method];

      // Si aucun tag n'est défini (undefined, vide, ou tableau vide), on en ajoute un
      if (!operationObject.tags || operationObject.tags.length === 0) {
        const guessedTag = guessTagFromPath(path);
        operationObject.tags = [guessedTag];
        usedTags.add(guessedTag);
      } else {
        usedTags.add(operationObject.tags[0]);
      }
    }
  }

  // Tri des tags par ordre alphabétique
  document.tags = Array.from(usedTags)
    .sort((a, b) => a.localeCompare(b))
    .map((tag) => ({ name: tag }));
}

function guessTagFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean); // Enlève les segments vides
  const first = segments[0] || 'Default';
  return capitalize(first);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
