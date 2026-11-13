import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

/**
 * Équipement sélectionné, partagé entre le plan et les tableaux :
 * chaque vue lit et écrit la même sélection, aucune ne connaît les autres.
 */
export const SelectionStore = signalStore(
  { providedIn: 'root' },
  withState<{ equipmentId: number | null }>({ equipmentId: null }),
  withMethods((store) => ({
    /** Sélectionne l'équipement, ou le désélectionne s'il l'était déjà. */
    toggle(equipmentId: number): void {
      patchState(store, (state) => ({
        equipmentId: state.equipmentId === equipmentId ? null : equipmentId,
      }));
    },

    clear(): void {
      patchState(store, { equipmentId: null });
    },
  })),
);
