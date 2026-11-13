import { Routes } from '@angular/router';
import { anonymousGuard, authGuard, roleGuard } from '@demo/domain';

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
        path: 'plan',
        loadComponent: () => import('./features/plan/plan.page').then((m) => m.PlanPage),
      },
      {
        path: 'equipements',
        loadComponent: () =>
          import('./features/equipments/equipments.page').then((m) => m.EquipmentsPage),
      },
      {
        path: 'missions',
        loadComponent: () =>
          import('./features/missions/missions.page').then((m) => m.MissionsPage),
      },
      {
        path: 'alarmes',
        loadComponent: () => import('./features/alarms/alarms.page').then((m) => m.AlarmsPage),
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
