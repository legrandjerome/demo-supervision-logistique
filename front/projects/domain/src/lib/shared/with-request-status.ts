import { computed } from '@angular/core';
import { signalStoreFeature, withComputed, withState } from '@ngrx/signals';

export type RequestStatus = 'idle' | 'loading' | 'loaded' | { readonly error: string };

interface RequestStatusState {
  requestStatus: RequestStatus;
}

/**
 * Fonctionnalité de store partagée : suivi d'une requête (chargement, succès, erreur).
 * Chaque store métier la compose au lieu de redéclarer ses propres drapeaux.
 */
export function withRequestStatus() {
  return signalStoreFeature(
    withState<RequestStatusState>({ requestStatus: 'idle' }),
    withComputed(({ requestStatus }) => ({
      isLoading: computed(() => requestStatus() === 'loading'),
      isLoaded: computed(() => requestStatus() === 'loaded'),
      error: computed(() => {
        const status = requestStatus();
        return typeof status === 'object' ? status.error : null;
      }),
    })),
  );
}

export const setLoading = (): RequestStatusState => ({ requestStatus: 'loading' });
export const setLoaded = (): RequestStatusState => ({ requestStatus: 'loaded' });
export const setError = (error: string): RequestStatusState => ({ requestStatus: { error } });
