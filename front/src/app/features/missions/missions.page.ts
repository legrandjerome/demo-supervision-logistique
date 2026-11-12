import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import {
  AuthStore,
  isCancellable,
  Mission,
  MISSION_STATUS_LABELS,
  MISSION_STATUSES,
  MissionStore,
  NewMission,
  MissionStatus,
} from '@demo/domain';
import { ErrorBanner, PageHeader, StatusBadge, Tone } from '@demo/ui';
import { debounceTime, distinctUntilChanged, firstValueFrom } from 'rxjs';
import { MISSION_STATUS_TONES } from '../../shared/tones';
import { MissionDialog } from './mission.dialog';

@Component({
  selector: 'app-missions-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    ErrorBanner,
    PageHeader,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './missions.page.html',
  styleUrl: '../list-page.scss',
})
export class MissionsPage {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly auth = inject(AuthStore);
  protected readonly store = inject(MissionStore);

  protected readonly statuses = MISSION_STATUSES;
  protected readonly statusLabels = MISSION_STATUS_LABELS;

  // Les cellules mat-table ne sont pas typées : ces accesseurs gardent les index sûrs.
  protected readonly statusLabelOf = (value: MissionStatus): string => MISSION_STATUS_LABELS[value];
  protected readonly statusToneOf = (value: MissionStatus): Tone => MISSION_STATUS_TONES[value];
  protected readonly isCancellable = isCancellable;

  protected readonly canCreate = computed(() => this.auth.hasRole('ROLE_OPERATOR'));
  protected readonly canCancel = computed(() => this.auth.hasRole('ROLE_SUPERVISOR'));
  protected readonly columns = computed(() => [
    'reference',
    'loadUnit',
    'route',
    'priority',
    'status',
    'equipment',
    'createdAt',
    ...(this.canCancel() ? ['actions'] : []),
  ]);

  protected readonly search = new FormControl(this.store.query().search, { nonNullable: true });

  constructor() {
    // La requête est un signal : chaque changement de filtre ou de page relance le chargement.
    this.store.load(this.store.query);

    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => this.store.setQuery({ search }));
  }

  protected paginate(event: PageEvent): void {
    this.store.setQuery({ page: event.pageIndex + 1, limit: event.pageSize });
  }

  protected async create(): Promise<void> {
    const mission = await firstValueFrom(
      this.dialog.open<MissionDialog, void, NewMission>(MissionDialog).afterClosed(),
    );
    if (!mission) {
      return;
    }
    const ok = await this.store.create(mission);
    this.notify(ok ? 'Mission créée.' : (this.store.error() ?? 'Création refusée.'));
  }

  protected async cancel(mission: Mission): Promise<void> {
    const ok = await this.store.cancel(mission.id);
    this.notify(
      ok ? `Mission ${mission.reference} annulée.` : (this.store.error() ?? 'Annulation refusée.'),
    );
  }

  private notify(message: string): void {
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
