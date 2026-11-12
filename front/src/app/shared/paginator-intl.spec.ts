import { FrenchPaginatorIntl } from './paginator-intl';

describe('FrenchPaginatorIntl', () => {
  const intl = new FrenchPaginatorIntl();

  it('décrit la plage affichée', () => {
    expect(intl.getRangeLabel(0, 10, 42)).toBe('1 – 10 sur 42');
    expect(intl.getRangeLabel(4, 10, 42)).toBe('41 – 42 sur 42');
  });

  it('gère une liste vide', () => {
    expect(intl.getRangeLabel(0, 10, 0)).toBe('0 sur 0');
  });
});
