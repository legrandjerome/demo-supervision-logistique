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
}

const initialState: MissionState = {
  query: { page: 1, limit: 10, status: null, search: '' },
  total: 0,
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
                { total: page.total },
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
