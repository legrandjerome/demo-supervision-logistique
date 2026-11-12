import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import {
  AuthStore,
  Equipment,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUSES,
  EQUIPMENT_TYPE_LABELS,
  EQUIPMENT_TYPES,
  EquipmentStatus,
  EquipmentStore,
  EquipmentType,
} from '@demo/domain';
import { ErrorBanner, PageHeader, StatusBadge, Tone } from '@demo/ui';
import { EQUIPMENT_STATUS_TONES } from '../../shared/tones';

@Component({
  selector: 'app-equipments-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    ErrorBanner,
    PageHeader,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipments.page.html',
  styleUrl: '../list-page.scss',
})
export class EquipmentsPage {
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthStore);
  protected readonly store = inject(EquipmentStore);

  protected readonly statuses = EQUIPMENT_STATUSES;
  protected readonly types = EQUIPMENT_TYPES;
  protected readonly statusLabels = EQUIPMENT_STATUS_LABELS;
  protected readonly typeLabels = EQUIPMENT_TYPE_LABELS;

  // Les cellules mat-table ne sont pas typées : ces accesseurs gardent les index sûrs.
  protected readonly statusLabelOf = (value: EquipmentStatus): string =>
    EQUIPMENT_STATUS_LABELS[value];
  protected readonly statusToneOf = (value: EquipmentStatus): Tone => EQUIPMENT_STATUS_TONES[value];
  protected readonly typeLabelOf = (value: EquipmentType): string => EQUIPMENT_TYPE_LABELS[value];

  protected readonly canChangeStatus = computed(() => this.auth.hasRole('ROLE_SUPERVISOR'));
  protected readonly columns = computed(() => [
    'code',
    'name',
    'type',
    'zone',
    'status',
    'statusChangedAt',
    ...(this.canChangeStatus() ? ['actions'] : []),
  ]);

  constructor() {
    void this.store.load();
  }

  protected async changeStatus(equipment: Equipment, status: EquipmentStatus): Promise<void> {
    const ok = await this.store.changeStatus(equipment.id, status);
    this.snackBar.open(
      ok
        ? `${equipment.code} : ${this.statusLabels[status].toLowerCase()}`
        : (this.store.error() ?? 'Changement d’état refusé.'),
      'Fermer',
      { duration: 4000 },
    );
  }
}
