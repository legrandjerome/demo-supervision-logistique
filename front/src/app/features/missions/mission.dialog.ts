import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NewMission } from '@demo/domain';

/** Formulaire de création d'une mission ; se ferme avec la mission saisie ou undefined. */
@Component({
  selector: 'app-mission-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Nouvelle mission</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <mat-form-field>
          <mat-label>Unité logistique</mat-label>
          <input matInput formControlName="loadUnit" placeholder="UL-48213" />
          <mat-error>Requise, 20 caractères au plus.</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Origine</mat-label>
          <input matInput formControlName="source" placeholder="REC-01" />
          <mat-error>Requise, 30 caractères au plus.</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Destination</mat-label>
          <input matInput formControlName="destination" placeholder="STK-A-12-03" />
          <mat-error>Requise, différente de l’origine.</mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Priorité</mat-label>
          <mat-select formControlName="priority">
            @for (priority of priorities; track priority) {
              <mat-option [value]="priority">{{ priority }}</mat-option>
            }
          </mat-select>
          <mat-hint>1 = la plus haute</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Annuler</button>
        <button matButton="filled" type="submit">Créer</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-dialog-content {
      display: grid;
      gap: 0.25rem;
      min-width: min(24rem, 80vw);
      padding-top: 0.5rem !important;
    }
  `,
})
export class MissionDialog {
  private readonly dialogRef = inject<MatDialogRef<MissionDialog, NewMission>>(MatDialogRef);

  protected readonly priorities = [1, 2, 3, 4, 5];

  protected readonly form = inject(FormBuilder).nonNullable.group(
    {
      loadUnit: ['', [Validators.required, Validators.maxLength(20)]],
      source: ['', [Validators.required, Validators.maxLength(30)]],
      destination: ['', [Validators.required, Validators.maxLength(30)]],
      priority: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    },
    {
      validators: (group) => {
        const { source, destination } = group.value as { source?: string; destination?: string };
        const same = !!source && source.trim() === destination?.trim();
        const control = group.get('destination');
        if (same) {
          control?.setErrors({ ...control.errors, sameAsSource: true });
        } else if (control?.hasError('sameAsSource')) {
          const { sameAsSource: _, ...others } = control.errors ?? {};
          control.setErrors(Object.keys(others).length ? others : null);
        }
        return null;
      },
    },
  );

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { loadUnit, source, destination, priority } = this.form.getRawValue();
    this.dialogRef.close({
      loadUnit: loadUnit.trim(),
      source: source.trim(),
      destination: destination.trim(),
      priority,
    });
  }
}
