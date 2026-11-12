import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UsersApi } from './users.api';

@Component({
  selector: 'app-users-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Utilisateurs</h1>
    <section class="card">
      @if (users.isLoading()) {
        <p class="muted">Chargement…</p>
      } @else if (users.error()) {
        <p class="error" role="alert">Impossible de charger les utilisateurs.</p>
      } @else {
        <table>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">E-mail</th>
              <th scope="col">Rôles effectifs</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users.value(); track user.id) {
              <tr>
                <td>{{ user.displayName }}</td>
                <td>{{ user.email }}</td>
                <td>
                  @for (role of user.roles; track role) {
                    <span class="badge">{{ role }}</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .badge + .badge {
      margin-left: 0.375rem;
    }
  `,
})
export class UsersPage {
  private readonly api = inject(UsersApi);

  protected readonly users = rxResource({
    stream: () => this.api.list(),
    defaultValue: [],
  });
}
