export type EquipmentType = 'CONVEYOR' | 'STACKER_CRANE' | 'SHUTTLE' | 'PICKING_STATION';
export type EquipmentStatus = 'RUNNING' | 'STOPPED' | 'FAULT' | 'MAINTENANCE';

export interface Equipment {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly type: EquipmentType;
  readonly zone: string;
  readonly status: EquipmentStatus;
  readonly statusChangedAt: string;
}

export interface EquipmentFilter {
  readonly status: EquipmentStatus | null;
  readonly type: EquipmentType | null;
  readonly zone: string | null;
}

export const EQUIPMENT_STATUSES: readonly EquipmentStatus[] = [
  'RUNNING',
  'STOPPED',
  'FAULT',
  'MAINTENANCE',
];

export const EQUIPMENT_TYPES: readonly EquipmentType[] = [
  'CONVEYOR',
  'STACKER_CRANE',
  'SHUTTLE',
  'PICKING_STATION',
];

export const EQUIPMENT_STATUS_LABELS: Readonly<Record<EquipmentStatus, string>> = {
  RUNNING: 'En marche',
  STOPPED: 'À l’arrêt',
  FAULT: 'En défaut',
  MAINTENANCE: 'En maintenance',
};

export const EQUIPMENT_TYPE_LABELS: Readonly<Record<EquipmentType, string>> = {
  CONVEYOR: 'Convoyeur',
  STACKER_CRANE: 'Transstockeur',
  SHUTTLE: 'Navette',
  PICKING_STATION: 'Poste de préparation',
};
