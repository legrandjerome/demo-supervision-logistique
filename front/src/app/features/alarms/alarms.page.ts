import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Alarm, ALARM_SEVERITY_LABELS, AlarmStore, AuthStore, AlarmSeverity } from '@demo/domain';
import { ErrorBanner, PageHeader, StatusBadge, Tone } from '@demo/ui';
import { ALARM_SEVERITY_TONES } from '../../shared/tones';

@Component({
  selector: 'app-alarms-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatTableModule,
    ErrorBanner,
    PageHeader,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alarms.page.html',
  styleUrl: '../list-page.scss',
})
export class AlarmsPage {
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthStore);
  protected readonly store = inject(AlarmStore);

  // Les cellules mat-table ne sont pas typées : ces accesseurs gardent les index sûrs.
  protected readonly severityLabelOf = (value: AlarmSeverity): string =>
    ALARM_SEVERITY_LABELS[value];
  protected readonly severityToneOf = (value: AlarmSeverity): Tone => ALARM_SEVERITY_TONES[value];
  protected readonly canAcknowledge = computed(() => this.auth.hasRole('ROLE_OPERATOR'));
  protected readonly columns = ['severity', 'equipment', 'message', 'raisedAt', 'acknowledgement'];

  constructor() {
    void this.store.load();
  }

  protected async acknowledge(alarm: Alarm): Promise<void> {
    const ok = await this.store.acknowledge(alarm.id);
    this.snackBar.open(
      ok ? 'Alarme acquittée.' : (this.store.error() ?? 'Acquittement refusé.'),
      'Fermer',
      { duration: 4000 },
    );
  }
}
