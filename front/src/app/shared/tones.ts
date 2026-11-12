import { AlarmSeverity, EquipmentStatus, MissionStatus } from '@demo/domain';
import { Tone } from '@demo/ui';

/** Correspondance états métier → tons visuels : le seul endroit où métier et interface se croisent. */
export const EQUIPMENT_STATUS_TONES: Readonly<Record<EquipmentStatus, Tone>> = {
  RUNNING: 'success',
  STOPPED: 'neutral',
  FAULT: 'danger',
  MAINTENANCE: 'warning',
};

export const MISSION_STATUS_TONES: Readonly<Record<MissionStatus, Tone>> = {
  CREATED: 'neutral',
  IN_PROGRESS: 'info',
  DONE: 'success',
  CANCELLED: 'warning',
  ERROR: 'danger',
};

export const ALARM_SEVERITY_TONES: Readonly<Record<AlarmSeverity, Tone>> = {
  CRITICAL: 'danger',
  WARNING: 'warning',
  INFO: 'info',
};
