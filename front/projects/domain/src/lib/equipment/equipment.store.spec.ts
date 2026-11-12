import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Equipment } from './equipment.models';
import { EquipmentStore } from './equipment.store';

const equipments: Equipment[] = [
  {
    id: 1,
    code: 'CV-101',
    name: 'Convoyeur réception 1',
    type: 'CONVEYOR',
    zone: 'Réception',
    status: 'RUNNING',
    statusChangedAt: '2026-11-12T08:00:00+00:00',
  },
  {
    id: 2,
    code: 'TK-201',
    name: 'Transstockeur allée A',
    type: 'STACKER_CRANE',
    zone: 'Stockage',
    status: 'FAULT',
    statusChangedAt: '2026-11-12T09:30:00+00:00',
  },
  {
    id: 3,
    code: 'CV-301',
    name: 'Convoyeur expédition 1',
    type: 'CONVEYOR',
    zone: 'Expédition',
    status: 'RUNNING',
    statusChangedAt: '2026-11-12T07:15:00+00:00',
  },
];

describe('EquipmentStore', () => {
  let store: InstanceType<typeof EquipmentStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(EquipmentStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const load = async (): Promise<void> => {
    const loaded = store.load();
    http.expectOne('/api/equipments').flush(equipments);
    await loaded;
  };

  it('charge les équipements et calcule les indicateurs', async () => {
    const loaded = store.load();
    expect(store.isLoading()).toBe(true);

    http.expectOne('/api/equipments').flush(equipments);
    await loaded;

    expect(store.isLoaded()).toBe(true);
    expect(store.entities()).toHaveLength(3);
    expect(store.countByStatus()).toEqual({ RUNNING: 2, STOPPED: 0, FAULT: 1, MAINTENANCE: 0 });
    expect(store.zones()).toEqual(['Expédition', 'Réception', 'Stockage']);
  });

  it('expose un message quand le chargement échoue', async () => {
    const loaded = store.load();
    http.expectOne('/api/equipments').error(new ProgressEvent('error'));
    await loaded;

    expect(store.error()).toBe('API injoignable. Vérifiez que le serveur est démarré.');
    expect(store.entities()).toEqual([]);
  });

  it('combine les filtres', async () => {
    await load();

    store.setFilter({ type: 'CONVEYOR' });
    expect(store.filtered().map((equipment) => equipment.code)).toEqual(['CV-101', 'CV-301']);

    store.setFilter({ zone: 'Expédition' });
    expect(store.filtered().map((equipment) => equipment.code)).toEqual(['CV-301']);

    store.setFilter({ status: 'FAULT' });
    expect(store.filtered()).toEqual([]);

    store.resetFilter();
    expect(store.filtered()).toHaveLength(3);
  });

  it('met à jour l’équipement après un changement d’état accepté', async () => {
    await load();

    const changed = store.changeStatus(2, 'MAINTENANCE');
    const request = http.expectOne('/api/equipments/2/status');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'MAINTENANCE' });
    request.flush({ ...equipments[1], status: 'MAINTENANCE' });

    expect(await changed).toBe(true);
    expect(store.entityMap()[2].status).toBe('MAINTENANCE');
    expect(store.countByStatus().FAULT).toBe(0);
  });

  it('conserve l’état quand l’API refuse le changement', async () => {
    await load();

    const changed = store.changeStatus(2, 'RUNNING');
    http
      .expectOne('/api/equipments/2/status')
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(await changed).toBe(false);
    expect(store.entityMap()[2].status).toBe('FAULT');
    expect(store.error()).toBe('Action réservée à un autre rôle.');
  });
});
