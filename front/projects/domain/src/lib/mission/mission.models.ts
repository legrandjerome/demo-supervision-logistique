export type MissionStatus = 'CREATED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'ERROR';

export interface Mission {
  readonly id: number;
  readonly reference: string;
  readonly loadUnit: string;
  readonly source: string;
  readonly destination: string;
  readonly priority: number;
  readonly status: MissionStatus;
  readonly equipmentCode: string | null;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
}

export interface MissionQuery {
  readonly page: number;
  readonly limit: number;
  readonly status: MissionStatus | null;
  readonly search: string;
}

export interface NewMission {
  readonly loadUnit: string;
  readonly source: string;
  readonly destination: string;
  readonly priority: number;
}

export const MISSION_STATUSES: readonly MissionStatus[] = [
  'CREATED',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
  'ERROR',
];

export const MISSION_STATUS_LABELS: Readonly<Record<MissionStatus, string>> = {
  CREATED: 'Créée',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
  CANCELLED: 'Annulée',
  ERROR: 'En erreur',
};

/** Une mission ne peut être annulée que tant qu'elle n'est pas terminée. */
export const isCancellable = (mission: Mission): boolean =>
  mission.status === 'CREATED' || mission.status === 'IN_PROGRESS';
