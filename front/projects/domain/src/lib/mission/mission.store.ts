import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, firstValueFrom, pipe, switchMap, tap } from 'rxjs';
import { describeHttpError } from '../shared/http-error';
import { setError, setLoaded, setLoading, withRequestStatus } from '../shared/with-request-status';
import { MissionApi } from './mission.api';
import { Mission, MissionQuery, NewMission } from './mission.models';

interface MissionState {
  query: MissionQuery;
  total: number;
  /** Missions créées ailleurs depuis le dernier chargement, absentes de la page affichée. */
  unseen: number;
}

const initialState: MissionState = {
  query: { page: 1, limit: 10, status: null, search: '' },
  total: 0,
  unseen: 0,
};

export const MissionStore = signalStore(
  { providedIn: 'root' },
  withEntities<Mission>(),
  withRequestStatus(),
  withState(initialState),
  withComputed(({ entities }) => ({
    inProgressOnPage: computed(
      () => entities().filter((mission) => mission.status === 'IN_PROGRESS').length,
    ),
  })),
  withMethods((store, api = inject(MissionApi)) => {
    /**
     * Charge une page. Branché sur le signal `query`, il se relance à chaque changement ;
     * switchMap abandonne la requête précédente si l'utilisateur tape ou pagine vite.
     */
    const load = rxMethod<MissionQuery>(
      pipe(
        tap(() => patchState(store, setLoading())),
        switchMap((query) =>
          api.list(query).pipe(
            tap((page) =>
              patchState(
                store,
                setAllEntities([...page.items]),
                { total: page.total, unseen: 0 },
                setLoaded(),
              ),
            ),
            catchError((error: unknown) => {
              patchState(store, setError(describeHttpError(error)));
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      load,

      /** Modifie la recherche ; tout changement de filtre revient à la première page. */
      setQuery(patch: Partial<MissionQuery>): void {
        patchState(store, (state) => ({
          query: { ...state.query, page: 1, ...patch },
        }));
      },

      /**
       * Applique une mise à jour reçue en direct. Une mission affichée est remplacée sur place ;
       * une mission inconnue est seulement comptée : insérer une ligne sous le curseur de
       * l'utilisateur déplacerait ce qu'il est en train de lire.
       */
      applyRemote(mission: Mission): void {
        if (store.entityMap()[mission.id]) {
          patchState(store, setEntity(mission));
        } else if (mission.status === 'CREATED') {
          patchState(store, (state) => ({ unseen: state.unseen + 1 }));
        }
      },

      /** Recharge la page courante, par exemple pour afficher les missions créées ailleurs. */
      reload(): void {
        load(store.query());
      },

      /** Crée une mission puis recharge la première page ; renvoie true en cas de succès. */
      async create(mission: NewMission): Promise<boolean> {
        try {
          await firstValueFrom(api.create(mission));
          const query = { ...store.query(), page: 1 };
          patchState(store, { query });
          load(query);
          return true;
        } catch (error) {
          patchState(store, setError(describeHttpError(error)));
          return false;
        }
      },

      /** Annule une mission ; renvoie true si l'API a accepté. */
      async cancel(id: number): Promise<boolean> {
        try {
          const mission = await firstValueFrom(api.cancel(id));
          patchState(store, setEntity(mission), setLoaded());
          return true;
        } catch (error) {
          patchState(store, setError(describeHttpError(error)));
          return false;
        }
      },
    };
  }),
);
