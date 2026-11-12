import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Alarm } from './alarm.models';
import { AlarmStore } from './alarm.store';

const equipment = { id: 2, code: 'TK-201', name: 'Transstockeur allée A' };

const alarms: Alarm[] = [
  {
    id: 1,
    severity: 'CRITICAL',
    message: 'Défaut variateur levage',
    raisedAt: '2026-11-12T09:30:00+00:00',
    acknowledgedAt: null,
    acknowledgedBy: null,
    equipment,
  },
  {
    id: 2,
    severity: 'WARNING',
    message: 'Température moteur élevée',
    raisedAt: '2026-11-12T09:10:00+00:00',
    acknowledgedAt: null,
    acknowledgedBy: null,
    equipment,
  },
  {
    id: 3,
    severity: 'INFO',
    message: 'Maintenance préventive à planifier',
    raisedAt: '2026-11-11T16:00:00+00:00',
    acknowledgedAt: '2026-11-11T16:20:00+00:00',
    acknowledgedBy: 'Olivia Opératrice',
    equipment,
  },
];

describe('AlarmStore', () => {
  let store: InstanceType<typeof AlarmStore>;
  let http: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AlarmStore);
    http = TestBed.inject(HttpTestingController);

    const loaded = store.load();
    http.expectOne('/api/alarms').flush(alarms);
    await loaded;
  });

  afterEach(() => http.verify());

  it('n’affiche que les alarmes actives par défaut', () => {
    expect(store.visible().map((alarm) => alarm.id)).toEqual([1, 2]);
    expect(store.activeCountBySeverity()).toEqual({ CRITICAL: 1, WARNING: 1, INFO: 0 });
  });

  it('affiche l’historique à la demande', () => {
    store.showActiveOnly(false);

    expect(store.visible()).toHaveLength(3);
  });

  it('retire une alarme acquittée des alarmes actives', async () => {
    const acknowledged = store.acknowledge(1);
    http.expectOne({ method: 'POST', url: '/api/alarms/1/acknowledge' }).flush({
      ...alarms[0],
      acknowledgedAt: '2026-11-12T09:45:00+00:00',
      acknowledgedBy: 'Sam Superviseur',
    });

    expect(await acknowledged).toBe(true);
    expect(store.active().map((alarm) => alarm.id)).toEqual([2]);
    expect(store.activeCountBySeverity().CRITICAL).toBe(0);
    expect(store.entityMap()[1].acknowledgedBy).toBe('Sam Superviseur');
  });

  it('garde l’alarme active si l’acquittement est refusé', async () => {
    const acknowledged = store.acknowledge(1);
    http
      .expectOne({ method: 'POST', url: '/api/alarms/1/acknowledge' })
      .flush(null, { status: 409, statusText: 'Conflict' });

    expect(await acknowledged).toBe(false);
    expect(store.active()).toHaveLength(2);
    expect(store.error()).toBe('Action impossible dans l’état actuel.');
  });
});
