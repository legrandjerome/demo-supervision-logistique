import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';
import { AuthApi } from './auth.api';
import { Credentials, Role, User } from './auth.models';
import { TokenStorage } from './token.storage';

export type AuthStatus = 'anonymous' | 'loading' | 'authenticated';

interface AuthState {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'anonymous',
  error: null,
};

function toMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return 'Identifiants invalides.';
  }
  return 'Connexion impossible. Réessayez dans un instant.';
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ status, user }) => ({
    isAuthenticated: computed(() => status() === 'authenticated'),
    isLoading: computed(() => status() === 'loading'),
    roles: computed<readonly Role[]>(() => user()?.roles ?? []),
  })),
  withMethods((store, api = inject(AuthApi), storage = inject(TokenStorage)) => {
    const reset = (error: string | null = null): void => {
      storage.clear();
      patchState(store, { ...initialState, error });
    };

    /** Charge le profil associé au jeton ; renvoie true si la session est valide. */
    const loadSession = (token: string): Promise<boolean> => {
      patchState(store, { token, status: 'loading', error: null });
      return firstValueFrom(
        api.me().pipe(
          tap((user) => {
            storage.write(token);
            patchState(store, { user, status: 'authenticated' });
          }),
          map(() => true),
          catchError((error: unknown) => {
            reset(toMessage(error));
            return of(false);
          }),
        ),
      );
    };

    return {
      /** Authentifie l'utilisateur ; renvoie true en cas de succès. */
      login(credentials: Credentials): Promise<boolean> {
        patchState(store, { status: 'loading', error: null });
        return firstValueFrom(
          api.login(credentials).pipe(
            switchMap(({ token }) => loadSession(token)),
            catchError((error: unknown) => {
              reset(toMessage(error));
              return of(false);
            }),
          ),
        );
      },

      /** Restaure la session depuis le stockage au démarrage de l'application. */
      restore(): Promise<boolean> {
        const token = storage.read();
        return token ? loadSession(token) : Promise.resolve(false);
      },

      logout(): void {
        reset();
      },

      hasRole(role: Role): boolean {
        return store.roles().includes(role);
      },
    };
  }),
);
