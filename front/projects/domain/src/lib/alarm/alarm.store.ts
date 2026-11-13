import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';
import { describeHttpError } from '../shared/http-error';
import { setError, setLoaded, setLoading, withRequestStatus } from '../shared/with-request-status';
import { AlarmApi } from './alarm.api';
import { Alarm, ALARM_SEVERITIES, AlarmSeverity } from './alarm.models';

export const AlarmStore = signalStore(
  { providedIn: 'root' },
  withEntities<Alarm>(),
  withRequestStatus(),
  withState({ activeOnly: true }),
  withComputed(({ entities, activeOnly }) => {
    const active = computed(() => entities().filter((alarm) => alarm.acknowledgedAt === null));

    return {
      active,
      visible: computed(() => (activeOnly() ? active() : entities())),
      activeCountBySeverity: computed(() => {
        const counts = Object.fromEntries(
          ALARM_SEVERITIES.map((severity) => [severity, 0]),
        ) as Record<AlarmSeverity, number>;
        for (const alarm of active()) {
          counts[alarm.severity]++;
        }
        return counts;
      }),
    };
  }),
  withMethods((store, api = inject(AlarmApi)) => ({
    async load(): Promise<void> {
      patchState(store, setLoading());
      try {
        const alarms = await firstValueFrom(api.list());
        patchState(store, setAllEntities(alarms), setLoaded());
      } catch (error) {
        patchState(store, setError(describeHttpError(error)));
      }
    },

    showActiveOnly(activeOnly: boolean): void {
      patchState(store, { activeOnly });
    },

    /** Applique une mise à jour reçue en direct : nouvelle alarme ou acquittement par un collègue. */
    applyRemote(alarm: Alarm): void {
      patchState(store, setEntity(alarm));
    },

    /** Acquitte une alarme ; renvoie true si l'API a accepté. */
    async acknowledge(id: number): Promise<boolean> {
      try {
        const alarm = await firstValueFrom(api.acknowledge(id));
        patchState(store, setEntity(alarm), setLoaded());
        return true;
      } catch (error) {
        patchState(store, setError(describeHttpError(error)));
        return false;
      }
    },
  })),
);
