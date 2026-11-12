import { Routes } from '@angular/router';
import { anonymousGuard, authGuard, roleGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: 'connexion',
    canActivate: [anonymousGuard],
    loadComponent: () => import('./features/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'utilisateurs',
        canActivate: [roleGuard('ROLE_ADMIN')],
        loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
