import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, pipe, tap, throttleTime } from 'rxjs';
import { describeHttpError } from '../shared/http-error';
import { setError, setLoaded, setLoading, withRequestStatus } from '../shared/with-request-status';
import { ActivityApi } from './activity.api';
import { Activity } from './activity.models';

/** Intervalle minimal entre deux rechargements déclenchés par le temps réel. */
export const ACTIVITY_REFRESH_MS = 3000;

export const ActivityStore = signalStore(
  { providedIn: 'root' },
  withRequestStatus(),
  withState<{ activity: Activity | null }>({ activity: null }),
  withComputed(({ activity }) => ({
    closedInWindow: computed(() =>
      (activity()?.throughput ?? []).reduce(
        (total, point) => total + point.done + point.cancelled + point.error,
        0,
      ),
    ),
  })),
  withMethods((store, api = inject(ActivityApi)) => {
    const fetch = () =>
      api.get().pipe(
        tap((activity) => patchState(store, { activity }, setLoaded())),
        catchError((error: unknown) => {
          patchState(store, setError(describeHttpError(error)));
          return EMPTY;
        }),
      );

    return {
      load: rxMethod<void>(
        pipe(
          tap(() => patchState(store, setLoading())),
          exhaustMap(fetch),
        ),
      ),

      /**
       * Recharge après un événement temps réel. Une rafale d'événements ne déclenche qu'une
       * requête immédiate puis une de rattrapage : les graphiques restent à jour sans saturer l'API.
       */
      refreshSoon: rxMethod<void>(
        pipe(
          throttleTime(ACTIVITY_REFRESH_MS, undefined, { leading: true, trailing: true }),
          exhaustMap(fetch),
        ),
      ),
    };
  }),
);
