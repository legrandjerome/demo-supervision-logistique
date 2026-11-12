import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AlarmStore, AuthStore } from '@demo/domain';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule, MatToolbarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar>
      <span class="brand">Supervision logistique</span>
      <nav aria-label="Navigation principale">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Tableau de bord
        </a>
        <a routerLink="/equipements" routerLinkActive="active">Équipements</a>
        <a routerLink="/missions" routerLinkActive="active">Missions</a>
        <a routerLink="/alarmes" routerLinkActive="active">
          Alarmes
          @if (alarms.active().length; as count) {
            <span class="count" [attr.aria-label]="count + ' alarmes actives'">{{ count }}</span>
          }
        </a>
        @if (auth.hasRole('ROLE_ADMIN')) {
          <a routerLink="/utilisateurs" routerLinkActive="active">Utilisateurs</a>
        }
      </nav>
      <span class="user">{{ auth.user()?.displayName }}</span>
      <button matButton type="button" (click)="logout()">Se déconnecter</button>
    </mat-toolbar>
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    mat-toolbar {
      gap: 1.5rem;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .brand {
      font: var(--mat-sys-title-medium);
    }
    nav {
      display: flex;
      gap: 1.25rem;
      flex: 1;
      overflow-x: auto;
    }
    a {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      white-space: nowrap;
    }
    a.active {
      color: var(--mat-sys-on-surface);
      border-bottom-color: var(--mat-sys-primary);
    }
    .count {
      min-width: 1.25rem;
      padding: 0 0.375rem;
      border-radius: 999px;
      background: var(--mat-sys-error);
      color: var(--mat-sys-on-error);
      font: var(--mat-sys-label-small);
      text-align: center;
    }
    .user {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    main {
      max-width: 76rem;
      margin: 0 auto;
      padding: 1.5rem;
    }
  `,
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthStore);
  protected readonly alarms = inject(AlarmStore);

  constructor() {
    // Le compteur d'alarmes de la barre de navigation a besoin des alarmes dès l'ouverture.
    void this.alarms.load();
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigate(['/connexion']);
  }
}
