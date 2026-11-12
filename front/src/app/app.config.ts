import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthStore } from '@demo/domain';
import { routes } from './app.routes';
import { FrenchPaginatorIntl } from './shared/paginator-intl';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    // La session est restaurée avant la première navigation : les gardes lisent un état à jour.
    provideAppInitializer(() => inject(AuthStore).restore()),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: MatPaginatorIntl, useClass: FrenchPaginatorIntl },
  ],
};
