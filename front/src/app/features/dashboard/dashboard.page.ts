import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Tableau de bord</h1>
    <section class="card">
      <h2>Session</h2>
      <dl>
        <dt>Utilisateur</dt>
        <dd>{{ store.user()?.displayName }} ({{ store.user()?.email }})</dd>
        <dt>Rôles effectifs</dt>
        <dd>
          @for (role of store.roles(); track role) {
            <span class="badge">{{ role }}</span>
          }
        </dd>
      </dl>
    </section>
    <section class="card">
      <h2>À venir</h2>
      <p class="muted">
        Jalon 2 : équipements, missions de transport et alarmes. Jalon 3 : temps réel (Mercure) et
        vue D3 synchronisée avec les tableaux.
      </p>
    </section>
  `,
  styles: `
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 0.5rem 1.5rem;
      margin: 0;
    }
    dt {
      font-weight: 600;
    }
    dd {
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }
    .card + .card {
      margin-top: 1rem;
    }
  `,
})
export class DashboardPage {
  protected readonly store = inject(AuthStore);
}
