import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Mission } from './mission.models';
import { MissionStore } from './mission.store';

const mission = (id: number, overrides: Partial<Mission> = {}): Mission => ({
  id,
  reference: `M-${String(id).padStart(4, '0')}`,
  loadUnit: `UL-${1000 + id}`,
  source: 'REC-01',
  destination: 'STK-A-01-01',
  priority: 3,
  status: 'CREATED',
  equipmentCode: null,
  createdAt: '2026-11-12T08:00:00+00:00',
  startedAt: null,
  completedAt: null,
  ...overrides,
});

const page = (items: Mission[], total = items.length) => ({ items, total, page: 1, limit: 10 });

describe('MissionStore', () => {
  let store: InstanceType<typeof MissionStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(MissionStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('charge une page et son total', () => {
    store.load(store.query());

    const request = http.expectOne((req) => req.url === '/api/missions');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('limit')).toBe('10');
    expect(request.request.params.has('status')).toBe(false);
    expect(request.request.params.has('search')).toBe(false);
    request.flush(page([mission(1), mission(2, { status: 'IN_PROGRESS' })], 42));

    expect(store.entities()).toHaveLength(2);
    expect(store.total()).toBe(42);
    expect(store.inProgressOnPage()).toBe(1);
    expect(store.isLoaded()).toBe(true);
  });

  it('revient à la première page quand un filtre change', () => {
    store.setQuery({ page: 3 });
    expect(store.query().page).toBe(3);

    store.setQuery({ status: 'ERROR' });

    expect(store.query()).toEqual({ page: 1, limit: 10, status: 'ERROR', search: '' });
  });

  it('transmet les filtres à l’API', () => {
    store.setQuery({ status: 'DONE', search: '  UL-10 ' });
    store.load(store.query());

    const request = http.expectOne((req) => req.url === '/api/missions');
    expect(request.request.params.get('status')).toBe('DONE');
    expect(request.request.params.get('search')).toBe('UL-10');
    request.flush(page([]));
  });

  it('abandonne la requête précédente quand une nouvelle recherche arrive', () => {
    store.load({ ...store.query(), search: 'a' });
    const first = http.expectOne((req) => req.params.get('search') === 'a');

    store.load({ ...store.query(), search: 'ab' });

    expect(first.cancelled).toBe(true);
    http.expectOne((req) => req.params.get('search') === 'ab').flush(page([mission(7)]));
    expect(store.entities().map((item) => item.id)).toEqual([7]);
  });

  it('recharge la première page après une création', async () => {
    store.setQuery({ page: 2 });

    const created = store.create({
      loadUnit: 'UL-9001',
      source: 'REC-01',
      destination: 'EXP-02',
      priority: 1,
    });
    const post = http.expectOne({ method: 'POST', url: '/api/missions' });
    expect(post.request.body.priority).toBe(1);
    post.flush(mission(99), { status: 201, statusText: 'Created' });

    expect(await created).toBe(true);
    expect(store.query().page).toBe(1);
    http
      .expectOne((req) => req.method === 'GET' && req.url === '/api/missions')
      .flush(page([mission(99)]));
    expect(store.entities().map((item) => item.id)).toEqual([99]);
  });

  it('signale une création refusée', async () => {
    const created = store.create({ loadUnit: '', source: '', destination: '', priority: 3 });
    http
      .expectOne({ method: 'POST', url: '/api/missions' })
      .flush(null, { status: 422, statusText: 'Unprocessable Content' });

    expect(await created).toBe(false);
    expect(store.error()).toBe('Données invalides.');
  });

  it('remplace la mission annulée par la version de l’API', async () => {
    store.load(store.query());
    http.expectOne((req) => req.url === '/api/missions').flush(page([mission(1)]));

    const cancelled = store.cancel(1);
    http
      .expectOne({ method: 'POST', url: '/api/missions/1/cancel' })
      .flush(mission(1, { status: 'CANCELLED' }));

    expect(await cancelled).toBe(true);
    expect(store.entityMap()[1].status).toBe('CANCELLED');
  });

  it('signale une annulation impossible', async () => {
    const cancelled = store.cancel(1);
    http
      .expectOne({ method: 'POST', url: '/api/missions/1/cancel' })
      .flush(null, { status: 409, statusText: 'Conflict' });

    expect(await cancelled).toBe(false);
    expect(store.error()).toBe('Action impossible dans l’état actuel.');
  });
});
