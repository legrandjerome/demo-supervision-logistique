import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Alarm } from '../alarm/alarm.models';
import { AlarmStore } from '../alarm/alarm.store';
import { Equipment } from '../equipment/equipment.models';
import { EquipmentStore } from '../equipment/equipment.store';
import { LiveMissionStore } from '../mission/live-mission.store';
import { Mission } from '../mission/mission.models';
import { MissionStore } from '../mission/mission.store';
import { RealtimeClient, RealtimeEvent, RealtimeStatus } from './realtime.client';
import { RealtimeSync } from './realtime.sync';

const equipment: Equipment = {
  id: 2,
  code: 'TK-201',
  name: 'Transstockeur allée A',
  type: 'STACKER_CRANE',
  zone: 'Stockage',
  status: 'FAULT',
  statusChangedAt: '2026-11-12T09:30:00+00:00',
};

const mission: Mission = {
  id: 7,
  reference: 'M-0007',
  loadUnit: 'UL-1007',
  source: 'REC-01',
  destination: 'STK-A-01-01',
  priority: 3,
  status: 'IN_PROGRESS',
  equipmentCode: 'TK-201',
  createdAt: '2026-11-12T08:00:00+00:00',
  startedAt: '2026-11-12T08:01:00+00:00',
  completedAt: null,
};

const alarm: Alarm = {
  id: 4,
  severity: 'CRITICAL',
  message: 'Défaut variateur',
  raisedAt: '2026-11-12T09:30:00+00:00',
  acknowledgedAt: null,
  acknowledgedBy: null,
  equipment: { id: 2, code: 'TK-201', name: 'Transstockeur allée A' },
};

describe('RealtimeSync', () => {
  let events: Subject<RealtimeEvent>;
  let status: ReturnType<typeof signal<RealtimeStatus>>;
  let client: {
    events$: Subject<RealtimeEvent>;
    status: typeof status;
    start: () => void;
    stop: () => void;
  };
  let http: HttpTestingController;
  let sync: RealtimeSync;

  beforeEach(() => {
    events = new Subject<RealtimeEvent>();
    status = signal<RealtimeStatus>('offline');
    client = { events$: events, status, start: vi.fn(), stop: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RealtimeClient, useValue: client },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    sync = TestBed.inject(RealtimeSync);
  });

  it('démarre le client une seule fois', () => {
    sync.start();
    sync.start();

    expect(client.start).toHaveBeenCalledTimes(1);
  });

  it('achemine chaque événement vers son store', () => {
    sync.start();

    events.next({ type: 'equipment', data: equipment });
    events.next({ type: 'alarm', data: alarm });
    events.next({ type: 'mission', data: mission });

    expect(TestBed.inject(EquipmentStore).entityMap()[2].status).toBe('FAULT');
    expect(
      TestBed.inject(AlarmStore)
        .active()
        .map((item) => item.id),
    ).toEqual([4]);
    expect(TestBed.inject(LiveMissionStore).byEquipmentCode()['TK-201']).toEqual([mission]);
    // L'événement de mission demande aussi le rafraîchissement des graphiques.
    http.expectOne('/api/stats/activity').flush({
      windowInMinutes: 30,
      throughput: [],
      missionsByStatus: { CREATED: 0, IN_PROGRESS: 1, DONE: 0, CANCELLED: 0, ERROR: 0 },
    });
  });

  it('retire du plan une mission qui se termine', () => {
    sync.start();
    events.next({ type: 'mission', data: mission });
    http.expectOne('/api/stats/activity').flush(null);

    events.next({ type: 'mission', data: { ...mission, status: 'DONE' } });

    expect(TestBed.inject(LiveMissionStore).entities()).toEqual([]);
  });

  it('compte les missions créées ailleurs sans modifier la page affichée', () => {
    const missions = TestBed.inject(MissionStore);
    sync.start();

    events.next({ type: 'mission', data: { ...mission, id: 50, status: 'CREATED' } });
    http.expectOne('/api/stats/activity').flush(null);

    expect(missions.unseen()).toBe(1);
    expect(missions.entities()).toEqual([]);
  });

  it('recharge les stores à chaque connexion au flux', () => {
    sync.start();

    status.set('live');
    TestBed.tick();

    for (const url of ['/api/equipments', '/api/alarms', '/api/stats/activity']) {
      http.expectOne(url).flush(url === '/api/stats/activity' ? null : []);
    }
    http
      .expectOne((request) => request.url === '/api/missions')
      .flush({ items: [], total: 0, page: 1, limit: 100 });
  });

  it('n’écoute plus après l’arrêt', () => {
    sync.start();
    sync.stop();

    events.next({ type: 'equipment', data: equipment });

    expect(client.stop).toHaveBeenCalled();
    expect(TestBed.inject(EquipmentStore).entities()).toEqual([]);
  });
});
