import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './auth.models';
import { AuthStore } from './auth.store';

/** Réserve une route aux utilisateurs connectés. */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(AuthStore);
  const router = inject(Router);

  return store.isAuthenticated()
    ? true
    : router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
};

/** Renvoie vers le tableau de bord un utilisateur déjà connecté. */
export const anonymousGuard: CanActivateFn = () => {
  const store = inject(AuthStore);
  const router = inject(Router);

  return store.isAuthenticated() ? router.createUrlTree(['/']) : true;
};

/** Réserve une route à un rôle. L'API reste l'autorité : ce garde ne protège que l'affichage. */
export const roleGuard =
  (role: Role): CanActivateFn =>
  () => {
    const store = inject(AuthStore);
    const router = inject(Router);

    return store.hasRole(role) ? true : router.createUrlTree(['/']);
  };
