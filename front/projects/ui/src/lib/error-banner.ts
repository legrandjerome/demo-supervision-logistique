import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Message d'erreur annoncé aux lecteurs d'écran. */
@Component({
  selector: 'ui-error-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{ message() }}',
  host: { role: 'alert' },
  styles: `
    :host {
      display: block;
      padding: 0.75rem 1rem;
      margin-bottom: 1rem;
      border-radius: 0.5rem;
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
      font: var(--mat-sys-body-medium);
    }
  `,
})
export class ErrorBanner {
  readonly message = input.required<string>();
}
