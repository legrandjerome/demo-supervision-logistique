import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { authGuard, roleGuard } from './auth.guards';
import { Role } from './auth.models';
import { AuthStore } from './auth.store';

const run = (guard: CanActivateFn, url = '/utilisateurs') =>
  TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );

describe('gardes de route', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  const signIn = async (roles: Role[]): Promise<void> => {
    sessionStorage.setItem('demo-supervision.token', 'jwt');
    const restored = TestBed.inject(AuthStore).restore();
    TestBed.inject(HttpTestingController)
      .expectOne('/api/me')
      .flush({ id: 1, email: 'a@demo.test', displayName: 'A', roles });
    await restored;
  };

  it('renvoie un visiteur anonyme vers la connexion en gardant l’URL demandée', () => {
    const result = run(authGuard);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/connexion?retour=%2Futilisateurs');
  });

  it('laisse passer un utilisateur connecté', async () => {
    await signIn(['ROLE_OPERATOR', 'ROLE_USER']);

    expect(run(authGuard)).toBe(true);
  });

  it('refuse une route réservée à un rôle absent', async () => {
    await signIn(['ROLE_OPERATOR', 'ROLE_USER']);

    const result = run(roleGuard('ROLE_ADMIN'));

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('ouvre une route réservée au rôle présent', async () => {
    await signIn(['ROLE_ADMIN', 'ROLE_SUPERVISOR', 'ROLE_OPERATOR', 'ROLE_USER']);

    expect(run(roleGuard('ROLE_ADMIN'))).toBe(true);
  });
});
