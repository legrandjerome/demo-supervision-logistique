import { DatePipe, formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, LOCALE_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ActivityStore,
  ALARM_SEVERITY_LABELS,
  AlarmStore,
  EQUIPMENT_STATUS_LABELS,
  EQUIPMENT_STATUSES,
  EquipmentStore,
  MISSION_STATUS_LABELS,
  MISSION_STATUSES,
} from '@demo/domain';
import {
  BarList,
  ChartSeries,
  ErrorBanner,
  KpiCard,
  PageHeader,
  StackedColumns,
  StatusBadge,
} from '@demo/ui';
import { ALARM_SEVERITY_TONES, EQUIPMENT_STATUS_TONES } from '../../shared/tones';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DatePipe,
    RouterLink,
    BarList,
    ErrorBanner,
    KpiCard,
    PageHeader,
    StackedColumns,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly equipments = inject(EquipmentStore);
  protected readonly alarms = inject(AlarmStore);
  protected readonly activity = inject(ActivityStore);
  private readonly locale = inject(LOCALE_ID);

  protected readonly statuses = EQUIPMENT_STATUSES;
  protected readonly statusLabels = EQUIPMENT_STATUS_LABELS;
  protected readonly statusTones = EQUIPMENT_STATUS_TONES;
  protected readonly severityLabels = ALARM_SEVERITY_LABELS;
  protected readonly severityTones = ALARM_SEVERITY_TONES;

  /** Palette vérifiée pour rester distinguable en cas de daltonisme. */
  protected readonly throughputSeries: readonly ChartSeries[] = [
    { key: 'done', label: 'Terminées', color: '#1baf7a' },
    { key: 'cancelled', label: 'Annulées', color: '#2a78d6' },
    { key: 'error', label: 'En erreur', color: '#eb6834' },
  ];

  protected readonly error = computed(
    () => this.equipments.error() ?? this.alarms.error() ?? this.activity.error(),
  );

  protected readonly throughput = computed(() =>
    (this.activity.activity()?.throughput ?? []).map((point) => ({
      label: formatDate(point.minute, 'HH:mm', this.locale),
      values: { done: point.done, cancelled: point.cancelled, error: point.error },
    })),
  );

  protected readonly missionsByStatus = computed(() => {
    const counts = this.activity.activity()?.missionsByStatus;
    return MISSION_STATUSES.map((status) => ({
      label: MISSION_STATUS_LABELS[status],
      value: counts?.[status] ?? 0,
    }));
  });

  /** Les cinq alarmes actives les plus récentes. */
  protected readonly latestAlarms = computed(() =>
    [...this.alarms.active()].sort((a, b) => b.raisedAt.localeCompare(a.raisedAt)).slice(0, 5),
  );

  constructor() {
    void this.equipments.load();
    this.activity.load();
  }
}
