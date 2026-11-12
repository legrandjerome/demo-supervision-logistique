import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from './auth.models';
import { AuthStore } from './auth.store';
import { TokenStorage } from './token.storage';

const supervisor: User = {
  id: 2,
  email: 'superviseur@demo.test',
  displayName: 'Sam Superviseur',
  roles: ['ROLE_SUPERVISOR', 'ROLE_OPERATOR', 'ROLE_USER'],
};

/** Laisse la chaîne de promesses avancer jusqu'à la requête HTTP suivante. */
const flushMicrotasks = (): Promise<void> => new Promise((resolve) => setTimeout(resolve));

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;
  let http: HttpTestingController;
  let storage: TokenStorage;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorage);
  });

  afterEach(() => http.verify());

  it('démarre en session anonyme', () => {
    expect(store.status()).toBe('anonymous');
    expect(store.isAuthenticated()).toBe(false);
    expect(store.roles()).toEqual([]);
  });

  it('ouvre la session après une connexion réussie', async () => {
    const result = store.login({ email: supervisor.email, password: 'demo' });
    expect(store.isLoading()).toBe(true);

    http.expectOne('/api/login').flush({ token: 'jwt' });
    await flushMicrotasks();
    http.expectOne('/api/me').flush(supervisor);

    expect(await result).toBe(true);
    expect(store.user()).toEqual(supervisor);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.hasRole('ROLE_OPERATOR')).toBe(true);
    expect(store.hasRole('ROLE_ADMIN')).toBe(false);
    expect(storage.read()).toBe('jwt');
  });

  it('signale des identifiants invalides sans ouvrir de session', async () => {
    const result = store.login({ email: supervisor.email, password: 'faux' });

    http
      .expectOne('/api/login')
      .flush({ message: 'Invalid credentials.' }, { status: 401, statusText: 'Unauthorized' });

    expect(await result).toBe(false);
    expect(store.status()).toBe('anonymous');
    expect(store.error()).toBe('Identifiants invalides.');
    expect(storage.read()).toBeNull();
  });

  it('restaure la session à partir du jeton stocké', async () => {
    storage.write('jwt');

    const result = store.restore();
    http.expectOne('/api/me').flush(supervisor);

    expect(await result).toBe(true);
    expect(store.token()).toBe('jwt');
    expect(store.isAuthenticated()).toBe(true);
  });

  it('abandonne un jeton stocké que l’API refuse', async () => {
    storage.write('expiré');

    const result = store.restore();
    http.expectOne('/api/me').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await result).toBe(false);
    expect(store.token()).toBeNull();
    expect(storage.read()).toBeNull();
  });

  it('ne tente rien sans jeton stocké', async () => {
    expect(await store.restore()).toBe(false);
    expect(store.status()).toBe('anonymous');
  });

  it('ferme la session à la déconnexion', async () => {
    storage.write('jwt');
    const restored = store.restore();
    http.expectOne('/api/me').flush(supervisor);
    await restored;

    store.logout();

    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(storage.read()).toBeNull();
  });
});
