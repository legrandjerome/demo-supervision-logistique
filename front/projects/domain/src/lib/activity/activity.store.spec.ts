import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Activity } from './activity.models';
import { ACTIVITY_REFRESH_MS, ActivityStore } from './activity.store';

const activity: Activity = {
  windowInMinutes: 30,
  throughput: [
    { minute: '2026-11-12T10:00:00+00:00', done: 3, cancelled: 0, error: 1 },
    { minute: '2026-11-12T10:01:00+00:00', done: 2, cancelled: 1, error: 0 },
  ],
  missionsByStatus: { CREATED: 4, IN_PROGRESS: 3, DONE: 41, CANCELLED: 5, ERROR: 4 },
};

describe('ActivityStore', () => {
  let store: InstanceType<typeof ActivityStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(ActivityStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('charge l’activité et totalise les missions closes', () => {
    store.load();
    expect(store.isLoading()).toBe(true);

    http.expectOne('/api/stats/activity').flush(activity);

    expect(store.activity()).toEqual(activity);
    expect(store.closedInWindow()).toBe(7);
    expect(store.isLoaded()).toBe(true);
  });

  it('regroupe une rafale d’événements en deux requêtes au plus', () => {
    for (let index = 0; index < 20; index++) {
      store.refreshSoon();
    }
    http.expectOne('/api/stats/activity').flush(activity);

    vi.advanceTimersByTime(ACTIVITY_REFRESH_MS);
    http.expectOne('/api/stats/activity').flush(activity);

    vi.advanceTimersByTime(ACTIVITY_REFRESH_MS * 2);
    http.expectNone('/api/stats/activity');
  });

  it('conserve les dernières données si un rafraîchissement échoue', () => {
    store.load();
    http.expectOne('/api/stats/activity').flush(activity);

    store.refreshSoon();
    http.expectOne('/api/stats/activity').error(new ProgressEvent('error'));

    expect(store.activity()).toEqual(activity);
    expect(store.error()).toBe('API injoignable. Vérifiez que le serveur est démarré.');
  });
});
