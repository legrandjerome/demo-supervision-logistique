import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from './status-badge';

/** Indicateur chiffré du tableau de bord. */
@Component({
  selector: 'ui-kpi-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="value">{{ value() }}</span>
    <span class="label">{{ label() }}</span>
  `,
  host: { '[attr.data-tone]': 'tone()' },
  styles: `
    :host {
      --tone: var(--mat-sys-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 1.25rem;
      background: var(--mat-sys-surface-container-lowest);
      border: 1px solid var(--mat-sys-outline-variant);
      border-left: 4px solid var(--tone);
      border-radius: 0.5rem;
    }
    .value {
      font: var(--mat-sys-headline-medium);
      font-variant-numeric: tabular-nums;
    }
    .label {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    :host([data-tone='success']) {
      --tone: #2e7d32;
    }
    :host([data-tone='info']) {
      --tone: #1565c0;
    }
    :host([data-tone='warning']) {
      --tone: #b26a00;
    }
    :host([data-tone='danger']) {
      --tone: var(--mat-sys-error);
    }
  `,
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly tone = input<Tone>('neutral');
}
