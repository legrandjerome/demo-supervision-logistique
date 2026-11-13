import { Equipment } from '@demo/domain';
import { scaleBand } from 'd3-scale';

export interface PlanZone {
  readonly name: string;
  readonly x: number;
  readonly width: number;
}

export interface PlanNode {
  readonly equipment: Equipment;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Missions en cours portées par l'équipement. */
  readonly missions: number;
}

export interface PlanFlow {
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
}

export interface PlanGeometry {
  readonly width: number;
  readonly height: number;
  readonly zones: readonly PlanZone[];
  readonly nodes: readonly PlanNode[];
  readonly flows: readonly PlanFlow[];
}

/** Sens du flux physique dans l'entrepôt ; une zone inconnue se place à la suite. */
const ZONE_ORDER = ['Réception', 'Stockage', 'Préparation', 'Expédition'];

export const PLAN_WIDTH = 960;
const HEADER_HEIGHT = 40;
const NODE_HEIGHT = 60;
const NODE_GAP = 12;
const PADDING = 16;

/**
 * Plan schématique : une colonne par zone, dans le sens du flux, les équipements empilés par code.
 * Fonction pure : mêmes équipements, même plan.
 */
export function layoutWarehouse(
  equipments: readonly Equipment[],
  missionCountByCode: Readonly<Record<string, number>> = {},
): PlanGeometry {
  const zoneNames = [...new Set(equipments.map((equipment) => equipment.zone))].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );

  const x = scaleBand<string>()
    .domain(zoneNames)
    .range([0, PLAN_WIDTH])
    .paddingInner(0.12)
    .paddingOuter(0.02);

  const zones = zoneNames.map((name): PlanZone => ({
    name,
    x: x(name) ?? 0,
    width: x.bandwidth(),
  }));

  const nodes = zones.flatMap((zone) =>
    equipments
      .filter((equipment) => equipment.zone === zone.name)
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((equipment, row): PlanNode => ({
        equipment,
        x: zone.x + PADDING,
        y: HEADER_HEIGHT + PADDING + row * (NODE_HEIGHT + NODE_GAP),
        width: zone.width - 2 * PADDING,
        height: NODE_HEIGHT,
        missions: missionCountByCode[equipment.code] ?? 0,
      })),
  );

  const lowest = Math.max(
    HEADER_HEIGHT + PADDING + NODE_HEIGHT,
    ...nodes.map((n) => n.y + n.height),
  );
  const height = lowest + PADDING;

  const flows = zones.slice(1).map((zone, index): PlanFlow => {
    const previous = zones[index];
    return { x1: previous.x + previous.width + 4, x2: zone.x - 4, y: HEADER_HEIGHT / 2 };
  });

  return { width: PLAN_WIDTH, height, zones, nodes, flows };
}

function rank(zone: string): number {
  const index = ZONE_ORDER.indexOf(zone);
  return index === -1 ? ZONE_ORDER.length : index;
}
