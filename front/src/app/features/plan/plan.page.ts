import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  ALARM_SEVERITY_LABELS,
  AlarmStore,
  EQUIPMENT_STATUS_LABELS,
  EquipmentStore,
  LiveMissionStore,
  SelectionStore,
} from '@demo/domain';
import { ErrorBanner, PageHeader, StatusBadge } from '@demo/ui';
import { ALARM_SEVERITY_TONES, EQUIPMENT_STATUS_TONES } from '../../shared/tones';
import { WarehousePlan } from './warehouse-plan';

/**
 * Plan et tableaux synchronisés : tous lisent les mêmes stores et la même sélection.
 * Cliquer un équipement sur le plan ou dans le tableau filtre ses missions et ses alarmes.
 */
@Component({
  selector: 'app-plan-page',
  imports: [DatePipe, MatButtonModule, ErrorBanner, PageHeader, StatusBadge, WarehousePlan],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan.page.html',
  styleUrl: './plan.page.scss',
})
export class PlanPage {
  protected readonly equipments = inject(EquipmentStore);
  protected readonly missions = inject(LiveMissionStore);
  protected readonly alarms = inject(AlarmStore);
  protected readonly selection = inject(SelectionStore);

  protected readonly statusLabels = EQUIPMENT_STATUS_LABELS;
  protected readonly statusTones = EQUIPMENT_STATUS_TONES;
  protected readonly severityLabels = ALARM_SEVERITY_LABELS;
  protected readonly severityTones = ALARM_SEVERITY_TONES;

  protected readonly error = computed(
    () => this.equipments.error() ?? this.missions.error() ?? this.alarms.error(),
  );

  protected readonly sortedEquipments = computed(() =>
    [...this.equipments.entities()].sort((a, b) => a.code.localeCompare(b.code)),
  );

  protected readonly missionCountByCode = computed(() =>
    Object.fromEntries(
      Object.entries(this.missions.byEquipmentCode()).map(([code, list]) => [code, list.length]),
    ),
  );

  protected readonly selectedEquipment = computed(() => {
    const id = this.selection.equipmentId();
    return id === null ? null : (this.equipments.entityMap()[id] ?? null);
  });

  protected readonly visibleMissions = computed(() => {
    const selected = this.selectedEquipment();
    const missions = selected
      ? (this.missions.byEquipmentCode()[selected.code] ?? [])
      : this.missions.entities();
    return [...missions].sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
  });

  protected readonly visibleAlarms = computed(() => {
    const selected = this.selectedEquipment();
    const alarms = this.alarms.active();
    return [
      ...(selected ? alarms.filter((alarm) => alarm.equipment.id === selected.id) : alarms),
    ].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
  });

  constructor() {
    void this.equipments.load();
    void this.missions.load();
    void this.alarms.load();
  }
}
