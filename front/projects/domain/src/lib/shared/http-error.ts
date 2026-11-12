import { HttpErrorResponse } from '@angular/common/http';

const MESSAGES: Readonly<Record<number, string>> = {
  0: 'API injoignable. Vérifiez que le serveur est démarré.',
  400: 'Requête invalide.',
  403: 'Action réservée à un autre rôle.',
  404: 'Élément introuvable.',
  409: 'Action impossible dans l’état actuel.',
  422: 'Données invalides.',
};

/** Traduit une erreur HTTP en message affichable, sans dépendre du corps de la réponse. */
export function describeHttpError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return MESSAGES[error.status] ?? 'Erreur inattendue. Réessayez dans un instant.';
  }
  return 'Erreur inattendue. Réessayez dans un instant.';
}
