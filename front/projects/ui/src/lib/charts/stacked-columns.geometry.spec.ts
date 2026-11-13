import { ChartBox, ChartSeries, stackedColumnsGeometry } from './stacked-columns.geometry';

const series: ChartSeries[] = [
  { key: 'done', label: 'Terminées', color: '#1baf7a' },
  { key: 'error', label: 'En erreur', color: '#eb6834' },
];
const box: ChartBox = {
  width: 400,
  height: 200,
  margin: { top: 10, right: 10, bottom: 30, left: 30 },
};

describe('stackedColumnsGeometry', () => {
  const geometry = stackedColumnsGeometry(
    [
      { label: '10:00', values: { done: 6, error: 2 } },
      { label: '10:01', values: { done: 0, error: 0 } },
      { label: '10:02', values: { done: 3 } },
    ],
    series,
    box,
  );

  it('place une colonne par donnée dans la zone de tracé', () => {
    expect(geometry.columns).toHaveLength(3);
    for (const column of geometry.columns) {
      expect(column.band.x).toBeGreaterThanOrEqual(30);
      expect(column.band.x + column.band.width).toBeLessThanOrEqual(390);
    }
  });

  it('empile les séries et ignore les valeurs nulles', () => {
    expect(geometry.columns[0].segments.map((segment) => [segment.key, segment.value])).toEqual([
      ['done', 6],
      ['error', 2],
    ]);
    expect(geometry.columns[0].total).toBe(8);
    expect(geometry.columns[1].segments).toEqual([]);
    expect(geometry.columns[2].segments.map((segment) => segment.key)).toEqual(['done']);
  });

  it('gradue l’axe en entiers à partir de zéro', () => {
    expect(geometry.yTicks[0]).toEqual({ value: 0, y: 170 });
    expect(geometry.yTicks.every((tick) => Number.isInteger(tick.value))).toBe(true);
    expect(geometry.yTicks.at(-1)?.value).toBeGreaterThanOrEqual(8);
  });

  it('garde une échelle lisible quand tout est à zéro', () => {
    const empty = stackedColumnsGeometry([{ label: '10:00', values: {} }], series, box);

    expect(empty.columns[0].segments).toEqual([]);
    expect(empty.yTicks.at(-1)?.value).toBe(4);
  });

  it('limite la largeur des colonnes', () => {
    const single = stackedColumnsGeometry([{ label: '10:00', values: { done: 1 } }], series, box);
    const path = single.columns[0].segments[0].path;
    const [startX] = path.slice(1).split(',').map(Number);
    const endX = Number(/H([\d.]+)/.exec(path)?.[1]);

    expect(endX - startX).toBeLessThanOrEqual(24);
  });
});
