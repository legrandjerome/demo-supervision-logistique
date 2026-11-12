import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** En-tête de page : titre à gauche, actions projetées à droite. */
@Component({
  selector: 'ui-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>{{ title() }}</h1>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
      font: var(--mat-sys-headline-small);
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
}
