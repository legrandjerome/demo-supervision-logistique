import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import { stack } from 'd3-shape';

export interface ChartSeries {
  readonly key: string;
  readonly label: string;
  readonly color: string;
}

export interface StackedDatum {
  readonly label: string;
  readonly values: Readonly<Record<string, number>>;
}

export interface ChartBox {
  readonly width: number;
  readonly height: number;
  readonly margin: { top: number; right: number; bottom: number; left: number };
}

export interface ColumnSegment {
  readonly key: string;
  readonly color: string;
  readonly value: number;
  readonly path: string;
}

export interface Column {
  readonly index: number;
  readonly label: string;
  readonly total: number;
  /** Bande entière de la colonne : zone de survol plus large que le trait. */
  readonly band: { x: number; width: number };
  readonly segments: readonly ColumnSegment[];
}

export interface StackedColumnsGeometry {
  readonly columns: readonly Column[];
  readonly yTicks: readonly { y: number; value: number }[];
  readonly baseline: number;
  readonly plot: { left: number; right: number };
}

const MAX_COLUMN_WIDTH = 24;
const SEGMENT_GAP = 2;
const CAP_RADIUS = 4;

/**
 * Calcule la géométrie d'un histogramme empilé. D3 fait les mathématiques (échelles, empilement),
 * le gabarit Angular dessine : aucune manipulation directe du DOM.
 */
export function stackedColumnsGeometry(
  data: readonly StackedDatum[],
  series: readonly ChartSeries[],
  box: ChartBox,
): StackedColumnsGeometry {
  const left = box.margin.left;
  const right = box.width - box.margin.right;
  const baseline = box.height - box.margin.bottom;

  const x = scaleBand<number>()
    .domain(data.map((_, index) => index))
    .range([left, right])
    .paddingInner(0.3)
    .paddingOuter(0.15);

  const top = max(data, (datum) => series.reduce((sum, s) => sum + (datum.values[s.key] ?? 0), 0));
  // Au moins 4 en haut de l'axe : une série presque vide ne remplit pas tout le graphique.
  const y = scaleLinear()
    .domain([0, Math.max(4, top ?? 0)])
    .nice(4)
    .range([baseline, box.margin.top]);

  const layers = stack<StackedDatum>()
    .keys(series.map((s) => s.key))
    .value((datum, key) => datum.values[key] ?? 0)([...data]);

  const columnWidth = Math.min(MAX_COLUMN_WIDTH, x.bandwidth());

  const columns = data.map((datum, index): Column => {
    const bandX = x(index) ?? left;
    const columnX = bandX + (x.bandwidth() - columnWidth) / 2;
    const present = series
      .map((s, layerIndex) => ({ series: s, range: layers[layerIndex][index] }))
      .filter(({ range }) => range[1] > range[0]);

    const segments = present.map(({ series: s, range }, position): ColumnSegment => {
      const isTop = position === present.length - 1;
      const yTop = y(range[1]);
      const yBottom = y(range[0]);
      // Un interstice sépare deux segments ; le dernier touche la ligne de base.
      const bottom = position === 0 ? yBottom : yBottom - SEGMENT_GAP;
      return {
        key: s.key,
        color: s.color,
        value: range[1] - range[0],
        path: columnPath(columnX, yTop, columnWidth, Math.max(1, bottom - yTop), isTop),
      };
    });

    return {
      index,
      label: datum.label,
      total: present.reduce((sum, { range }) => sum + (range[1] - range[0]), 0),
      band: { x: bandX, width: x.bandwidth() },
      segments,
    };
  });

  const yTicks = y
    .ticks(4)
    .filter((value) => Number.isInteger(value))
    .map((value) => ({ value, y: y(value) }));

  return { columns, yTicks, baseline, plot: { left, right } };
}

/** Rectangle dont seul le sommet est arrondi quand il coiffe la colonne. */
function columnPath(x: number, y: number, width: number, height: number, rounded: boolean): string {
  const radius = rounded ? Math.min(CAP_RADIUS, width / 2, height) : 0;
  return [
    `M${x},${y + height}`,
    `V${y + radius}`,
    `Q${x},${y} ${x + radius},${y}`,
    `H${x + width - radius}`,
    `Q${x + width},${y} ${x + width},${y + radius}`,
    `V${y + height}`,
    'Z',
  ].join('');
}
