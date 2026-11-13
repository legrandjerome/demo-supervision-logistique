import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  ChartBox,
  ChartSeries,
  StackedDatum,
  stackedColumnsGeometry,
} from './stacked-columns.geometry';

const BOX: ChartBox = {
  width: 720,
  height: 240,
  margin: { top: 12, right: 8, bottom: 28, left: 32 },
};

/**
 * Histogramme empilé. Chaque colonne répond au survol ; un tableau équivalent est
 * fourni aux lecteurs d'écran.
 */
@Component({
  selector: 'ui-stacked-columns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="legend" aria-hidden="true">
      @for (item of series(); track item.key) {
        <li><span class="swatch" [style.background]="item.color"></span>{{ item.label }}</li>
      }
    </ul>

    <div class="plot" (pointerleave)="hovered.set(null)">
      <svg [attr.viewBox]="viewBox" role="img" [attr.aria-label]="label()">
        @for (tick of geometry().yTicks; track tick.value) {
          <line
            class="grid"
            [attr.x1]="geometry().plot.left"
            [attr.x2]="geometry().plot.right"
            [attr.y1]="tick.y"
            [attr.y2]="tick.y"
          />
          <text class="tick" [attr.x]="geometry().plot.left - 8" [attr.y]="tick.y" dy="0.32em">
            {{ tick.value }}
          </text>
        }

        @for (column of geometry().columns; track column.index) {
          <g [class.dimmed]="hovered() !== null && hovered() !== column.index">
            @for (segment of column.segments; track segment.key) {
              <path [attr.d]="segment.path" [attr.fill]="segment.color" />
            }
          </g>
          @if (column.index % labelEvery() === 0) {
            <text
              class="tick x"
              [attr.x]="column.band.x + column.band.width / 2"
              [attr.y]="geometry().baseline + 18"
            >
              {{ column.label }}
            </text>
          }
          <rect
            class="hit"
            [attr.x]="column.band.x"
            [attr.y]="0"
            [attr.width]="column.band.width"
            [attr.height]="geometry().baseline"
            (pointerenter)="hovered.set(column.index)"
          />
        }

        <line
          class="baseline"
          [attr.x1]="geometry().plot.left"
          [attr.x2]="geometry().plot.right"
          [attr.y1]="geometry().baseline"
          [attr.y2]="geometry().baseline"
        />
      </svg>

      @if (tooltip(); as tip) {
        <div class="tooltip" [style.left.%]="tip.left" [class.flip]="tip.left > 70">
          <span class="tooltip-title">{{ tip.label }}</span>
          @for (row of tip.rows; track row.key) {
            <span class="tooltip-row">
              <span class="key" [style.background]="row.color"></span>
              <strong>{{ row.value }}</strong> {{ row.label }}
            </span>
          }
        </div>
      }
    </div>

    <table class="visually-hidden">
      <caption>
        {{
          label()
        }}
      </caption>
      <thead>
        <tr>
          <th scope="col">{{ categoryLabel() }}</th>
          @for (item of series(); track item.key) {
            <th scope="col">{{ item.label }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (datum of data(); track $index) {
          <tr>
            <th scope="row">{{ datum.label }}</th>
            @for (item of series(); track item.key) {
              <td>{{ datum.values[item.key] ?? 0 }}</td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin: 0 0 0.5rem;
      padding: 0;
      list-style: none;
      font: var(--mat-sys-label-medium);
      color: var(--mat-sys-on-surface-variant);
    }
    .legend li {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .swatch {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 2px;
    }
    .plot {
      position: relative;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .grid {
      stroke: var(--mat-sys-outline-variant);
      stroke-width: 1;
      stroke-dasharray: 2 4;
    }
    .baseline {
      stroke: var(--mat-sys-outline);
      stroke-width: 1;
    }
    .tick {
      fill: var(--mat-sys-on-surface-variant);
      font-size: 11px;
      text-anchor: end;
      font-variant-numeric: tabular-nums;
    }
    .tick.x {
      text-anchor: middle;
    }
    .hit {
      fill: transparent;
    }
    g {
      transition: opacity 120ms;
    }
    .dimmed {
      opacity: 0.35;
    }
    .tooltip {
      position: absolute;
      top: 0;
      display: grid;
      gap: 0.125rem;
      padding: 0.5rem 0.75rem;
      transform: translateX(0.75rem);
      border-radius: 0.375rem;
      background: var(--mat-sys-inverse-surface);
      color: var(--mat-sys-inverse-on-surface);
      font: var(--mat-sys-body-small);
      white-space: nowrap;
      pointer-events: none;
    }
    .tooltip.flip {
      transform: translateX(calc(-100% - 0.75rem));
    }
    .tooltip-title {
      opacity: 0.8;
    }
    .tooltip-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .key {
      width: 0.75rem;
      height: 2px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: reduce) {
      g {
        transition: none;
      }
    }
  `,
})
export class StackedColumns {
  readonly data = input.required<readonly StackedDatum[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  /** Description du graphique pour les lecteurs d'écran et le tableau équivalent. */
  readonly label = input.required<string>();
  readonly categoryLabel = input('Catégorie');
  /** Une étiquette d'axe toutes les n colonnes. */
  readonly labelEvery = input(1);

  protected readonly viewBox = `0 0 ${BOX.width} ${BOX.height}`;
  protected readonly hovered = signal<number | null>(null);
  protected readonly geometry = computed(() =>
    stackedColumnsGeometry(this.data(), this.series(), BOX),
  );

  protected readonly tooltip = computed(() => {
    const index = this.hovered();
    const column = index === null ? undefined : this.geometry().columns[index];
    const datum = index === null ? undefined : this.data()[index];
    if (!column || !datum) {
      return null;
    }
    return {
      label: column.label,
      left: ((column.band.x + column.band.width) / BOX.width) * 100,
      rows: this.series().map((item) => ({
        key: item.key,
        label: item.label,
        color: item.color,
        value: datum.values[item.key] ?? 0,
      })),
    };
  });
}
