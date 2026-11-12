import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStore } from '../core/auth/auth.store';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <strong>Supervision logistique</strong>
      <nav aria-label="Navigation principale">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Tableau de bord
        </a>
        @if (store.hasRole('ROLE_ADMIN')) {
          <a routerLink="/utilisateurs" routerLinkActive="active">Utilisateurs</a>
        }
      </nav>
      <span class="user">{{ store.user()?.displayName }}</span>
      <button type="button" (click)="logout()">Se déconnecter</button>
    </header>
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    nav {
      display: flex;
      gap: 1rem;
      flex: 1;
    }
    a {
      color: var(--text-muted);
      text-decoration: none;
      padding: 0.25rem 0;
      border-bottom: 2px solid transparent;
    }
    a.active {
      color: var(--text);
      border-bottom-color: var(--accent);
    }
    .user {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    main {
      max-width: 64rem;
      margin: 0 auto;
      padding: 1.5rem;
    }
  `,
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly store = inject(AuthStore);

  protected logout(): void {
    this.store.logout();
    void this.router.navigate(['/connexion']);
  }
}
