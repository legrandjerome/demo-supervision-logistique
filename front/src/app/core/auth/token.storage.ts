import { Injectable } from '@angular/core';

const KEY = 'demo-supervision.token';

/**
 * Le jeton vit dans sessionStorage : il disparaît à la fermeture de l'onglet.
 * Compromis assumé pour une démo ; en production, un cookie httpOnly est préférable.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  read(): string | null {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  }

  write(token: string): void {
    try {
      sessionStorage.setItem(KEY, token);
    } catch {
      // Stockage indisponible : la session reste en mémoire.
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // Rien à nettoyer.
    }
  }
}
