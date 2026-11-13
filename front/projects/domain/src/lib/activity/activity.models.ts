import { MissionStatus } from '../mission/mission.models';

export interface ThroughputPoint {
  /** Début de la minute, au format ISO 8601. */
  readonly minute: string;
  readonly done: number;
  readonly cancelled: number;
  readonly error: number;
}

export interface Activity {
  readonly windowInMinutes: number;
  readonly throughput: readonly ThroughputPoint[];
  readonly missionsByStatus: Readonly<Record<MissionStatus, number>>;
}
