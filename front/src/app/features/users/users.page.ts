import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { UsersApi } from '@demo/domain';
import { ErrorBanner, PageHeader, StatusBadge } from '@demo/ui';

@Component({
  selector: 'app-users-page',
  imports: [MatTableModule, ErrorBanner, PageHeader, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-page-header title="Utilisateurs" />

    @if (users.error()) {
      <ui-error-banner message="Impossible de charger les utilisateurs." />
    }

    <div class="table-container">
      <table mat-table [dataSource]="users.value()">
        <ng-container matColumnDef="displayName">
          <th mat-header-cell *matHeaderCellDef>Nom</th>
          <td mat-cell *matCellDef="let user">{{ user.displayName }}</td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>E-mail</th>
          <td mat-cell *matCellDef="let user">{{ user.email }}</td>
        </ng-container>

        <ng-container matColumnDef="roles">
          <th mat-header-cell *matHeaderCellDef>Rôles effectifs</th>
          <td mat-cell *matCellDef="let user">
            <span class="roles">
              @for (role of user.roles; track role) {
                <ui-status-badge [label]="role" />
              }
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell empty" [attr.colspan]="columns.length">
            {{ users.isLoading() ? 'Chargement…' : 'Aucun utilisateur.' }}
          </td>
        </tr>
      </table>
    </div>
  `,
  styleUrl: '../list-page.scss',
  styles: `
    .roles {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }
  `,
})
export class UsersPage {
  private readonly api = inject(UsersApi);

  protected readonly columns = ['displayName', 'email', 'roles'];
  protected readonly users = rxResource({
    stream: () => this.api.list(),
    defaultValue: [],
  });
}
