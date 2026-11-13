import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { max } from 'd3-array';
import { scaleLinear } from 'd3-scale';

export interface BarListItem {
  readonly label: string;
  readonly value: number;
}

/** Barres horizontales à une seule série : chaque barre porte sa valeur, sans légende ni axe. */
@Component({
  selector: 'ui-bar-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl>
      @for (bar of bars(); track bar.label) {
        <div class="row">
          <dt>{{ bar.label }}</dt>
          <dd>
            <span class="bar" [style.width.%]="bar.width"></span>
            <span class="value">{{ bar.value }}</span>
          </dd>
        </div>
      }
    </dl>
  `,
  styles: `
    dl {
      display: grid;
      gap: 0.625rem;
      margin: 0;
    }
    .row {
      display: grid;
      grid-template-columns: 6.5rem 1fr;
      align-items: center;
      gap: 0.75rem;
    }
    dt {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }
    .bar {
      height: 0.75rem;
      min-width: 2px;
      border-radius: 0 4px 4px 0;
      background: var(--ui-bar-color, #2a78d6);
      transition: width 300ms ease;
    }
    .value {
      font: var(--mat-sys-label-large);
      font-variant-numeric: tabular-nums;
    }
    @media (prefers-reduced-motion: reduce) {
      .bar {
        transition: none;
      }
    }
  `,
})
export class BarList {
  readonly items = input.required<readonly BarListItem[]>();

  protected readonly bars = computed(() => {
    const items = this.items();
    // La plus longue barre laisse de la place à sa valeur, d'où la borne à 88 %.
    const width = scaleLinear()
      .domain([0, Math.max(1, max(items, (item) => item.value) ?? 0)])
      .range([0, 88]);
    return items.map((item) => ({ ...item, width: width(item.value) }));
  });
}
