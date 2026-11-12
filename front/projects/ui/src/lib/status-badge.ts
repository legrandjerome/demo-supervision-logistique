import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type Tone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

/** Pastille d'état : le libellé porte le sens, la couleur ne fait que le renforcer. */
@Component({
  selector: 'ui-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<span class="dot" aria-hidden="true"></span>{{ label() }}',
  host: { '[attr.data-tone]': 'tone()' },
  styles: `
    :host {
      --tone: var(--mat-sys-outline);
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.125rem 0.625rem 0.125rem 0.5rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
    }
    .dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--tone);
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
export class StatusBadge {
  readonly label = input.required<string>();
  readonly tone = input<Tone>('neutral');
}
