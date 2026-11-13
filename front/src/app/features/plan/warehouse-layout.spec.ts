import { Equipment } from '@demo/domain';
import { layoutWarehouse, PLAN_WIDTH } from './warehouse-layout';

const equipment = (id: number, code: string, zone: string): Equipment => ({
  id,
  code,
  name: code,
  type: 'CONVEYOR',
  zone,
  status: 'RUNNING',
  statusChangedAt: '2026-11-12T08:00:00+00:00',
});

describe('layoutWarehouse', () => {
  const equipments = [
    equipment(1, 'CV-501', 'Expédition'),
    equipment(2, 'TK-202', 'Stockage'),
    equipment(3, 'CV-101', 'Réception'),
    equipment(4, 'TK-201', 'Stockage'),
    equipment(5, 'QL-901', 'Contrôle qualité'),
  ];
  const plan = layoutWarehouse(equipments, { 'TK-202': 1 });

  it('range les zones dans le sens du flux, les zones inconnues à la fin', () => {
    expect(plan.zones.map((zone) => zone.name)).toEqual([
      'Réception',
      'Stockage',
      'Expédition',
      'Contrôle qualité',
    ]);
    expect(plan.flows).toHaveLength(3);
  });

  it('empile les équipements d’une zone par code, sans chevauchement', () => {
    const storage = plan.nodes.filter((node) => node.equipment.zone === 'Stockage');

    expect(storage.map((node) => node.equipment.code)).toEqual(['TK-201', 'TK-202']);
    expect(storage[1].y).toBeGreaterThanOrEqual(storage[0].y + storage[0].height);
    expect(storage[0].x).toBe(storage[1].x);
  });

  it('garde chaque équipement dans sa zone et dans le plan', () => {
    for (const node of plan.nodes) {
      const zone = plan.zones.find((candidate) => candidate.name === node.equipment.zone);
      expect(zone).toBeDefined();
      expect(node.x).toBeGreaterThanOrEqual(zone!.x);
      expect(node.x + node.width).toBeLessThanOrEqual(zone!.x + zone!.width);
      expect(node.y + node.height).toBeLessThanOrEqual(plan.height);
    }
    expect(Math.max(...plan.zones.map((zone) => zone.x + zone.width))).toBeLessThanOrEqual(
      PLAN_WIDTH,
    );
  });

  it('reporte le nombre de missions en cours sur l’équipement', () => {
    const byCode = Object.fromEntries(
      plan.nodes.map((node) => [node.equipment.code, node.missions]),
    );

    expect(byCode['TK-202']).toBe(1);
    expect(byCode['TK-201']).toBe(0);
  });

  it('produit un plan vide sans équipement', () => {
    const empty = layoutWarehouse([]);

    expect(empty.nodes).toEqual([]);
    expect(empty.zones).toEqual([]);
    expect(empty.height).toBeGreaterThan(0);
  });
});
