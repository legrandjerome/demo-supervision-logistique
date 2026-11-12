import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ALARM_SEVERITY_LABELS,
  AlarmStore,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUSES,
  EquipmentStore,
} from '@demo/domain';
import { ErrorBanner, KpiCard, PageHeader, StatusBadge } from '@demo/ui';
import { ALARM_SEVERITY_TONES, EQUIPMENT_STATUS_TONES } from '../../shared/tones';

@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, RouterLink, ErrorBanner, KpiCard, PageHeader, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly equipments = inject(EquipmentStore);
  protected readonly alarms = inject(AlarmStore);

  protected readonly statuses = EQUIPMENT_STATUSES;
  protected readonly statusLabels = EQUIPMENT_STATUS_LABELS;
  protected readonly statusTones = EQUIPMENT_STATUS_TONES;
  protected readonly severityLabels = ALARM_SEVERITY_LABELS;
  protected readonly severityTones = ALARM_SEVERITY_TONES;

  protected readonly error = computed(() => this.equipments.error() ?? this.alarms.error());

  /** Les cinq alarmes actives les plus récentes. */
  protected readonly latestAlarms = computed(() =>
    [...this.alarms.active()].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)).slice(0, 5),
  );

  constructor() {
    void this.equipments.load();
  }
}
