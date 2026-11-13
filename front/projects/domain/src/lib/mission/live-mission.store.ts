import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods } from '@ngrx/signals';
import { removeEntity, setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';
import { describeHttpError } from '../shared/http-error';
import { setError, setLoaded, setLoading, withRequestStatus } from '../shared/with-request-status';
import { MissionApi } from './mission.api';
import { Mission } from './mission.models';

/**
 * Missions en cours, toutes pages confondues : la vue du plan a besoin de l'ensemble,
 * là où `MissionStore` ne connaît que la page affichée.
 */
export const LiveMissionStore = signalStore(
  { providedIn: 'root' },
  withEntities<Mission>(),
  withRequestStatus(),
  withComputed(({ entities }) => ({
    /** Missions en cours regroupées par code d'équipement. */
    byEquipmentCode: computed(() => {
      const groups: Record<string, Mission[]> = {};
      for (const mission of entities()) {
        if (mission.equipmentCode) {
          (groups[mission.equipmentCode] ??= []).push(mission);
        }
      }
      return groups;
    }),
  })),
  withMethods((store, api = inject(MissionApi)) => ({
    async load(): Promise<void> {
      patchState(store, setLoading());
      try {
        const page = await firstValueFrom(
          api.list({ page: 1, limit: 100, status: 'IN_PROGRESS', search: '' }),
        );
        patchState(store, setAllEntities([...page.items]), setLoaded());
      } catch (error) {
        patchState(store, setError(describeHttpError(error)));
      }
    },

    /** Applique une mise à jour reçue en direct : la mission entre dans la liste ou en sort. */
    applyRemote(mission: Mission): void {
      patchState(
        store,
        mission.status === 'IN_PROGRESS' ? setEntity(mission) : removeEntity(mission.id),
      );
    },
  })),
);
