import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { firstValueFrom } from 'rxjs';
import { describeHttpError } from '../shared/http-error';
import { setError, setLoaded, setLoading, withRequestStatus } from '../shared/with-request-status';
import { EquipmentApi } from './equipment.api';
import {
  Equipment,
  EQUIPMENT_STATUSES,
  EquipmentFilter,
  EquipmentStatus,
} from './equipment.models';

const noFilter: EquipmentFilter = { status: null, type: null, zone: null };

export const EquipmentStore = signalStore(
  { providedIn: 'root' },
  withEntities<Equipment>(),
  withRequestStatus(),
  withState<{ filter: EquipmentFilter }>({ filter: noFilter }),
  withComputed(({ entities, filter }) => ({
    zones: computed(() => [...new Set(entities().map((equipment) => equipment.zone))].sort()),
    filtered: computed(() => {
      const { status, type, zone } = filter();
      return entities().filter(
        (equipment) =>
          (status === null || equipment.status === status) &&
          (type === null || equipment.type === type) &&
          (zone === null || equipment.zone === zone),
      );
    }),
    countByStatus: computed(() => {
      const counts = Object.fromEntries(EQUIPMENT_STATUSES.map((status) => [status, 0])) as Record<
        EquipmentStatus,
        number
      >;
      for (const equipment of entities()) {
        counts[equipment.status]++;
      }
      return counts;
    }),
  })),
  withMethods((store, api = inject(EquipmentApi)) => ({
    async load(): Promise<void> {
      patchState(store, setLoading());
      try {
        const equipments = await firstValueFrom(api.list());
        patchState(store, setAllEntities(equipments), setLoaded());
      } catch (error) {
        patchState(store, setError(describeHttpError(error)));
      }
    },

    setFilter(filter: Partial<EquipmentFilter>): void {
      patchState(store, (state) => ({ filter: { ...state.filter, ...filter } }));
    },

    resetFilter(): void {
      patchState(store, { filter: noFilter });
    },

    /** Change l'état d'un équipement ; renvoie true si l'API a accepté. */
    async changeStatus(id: number, status: EquipmentStatus): Promise<boolean> {
      try {
        const equipment = await firstValueFrom(api.changeStatus(id, status));
        patchState(store, setEntity(equipment), setLoaded());
        return true;
      } catch (error) {
        patchState(store, setError(describeHttpError(error)));
        return false;
      }
    },
  })),
);
