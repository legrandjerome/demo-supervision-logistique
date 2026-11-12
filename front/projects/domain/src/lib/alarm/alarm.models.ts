export type AlarmSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface Alarm {
  readonly id: number;
  readonly severity: AlarmSeverity;
  readonly message: string;
  readonly raisedAt: string;
  readonly acknowledgedAt: string | null;
  readonly acknowledgedBy: string | null;
  readonly equipment: {
    readonly id: number;
    readonly code: string;
    readonly name: string;
  };
}

export const ALARM_SEVERITIES: readonly AlarmSeverity[] = ['CRITICAL', 'WARNING', 'INFO'];

export const ALARM_SEVERITY_LABELS: Readonly<Record<AlarmSeverity, string>> = {
  CRITICAL: 'Critique',
  WARNING: 'Avertissement',
  INFO: 'Information',
};
