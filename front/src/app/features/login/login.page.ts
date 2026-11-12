import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@demo/domain';
import { ErrorBanner } from '@demo/ui';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, ErrorBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(AuthStore);

  protected readonly demoAccounts = [
    { label: 'Opérateur', email: 'operateur@demo.test' },
    { label: 'Superviseur', email: 'superviseur@demo.test' },
    { label: 'Administrateur', email: 'admin@demo.test' },
  ] as const;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected fill(email: string): void {
    this.form.setValue({ email, password: 'demo' });
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (await this.store.login(this.form.getRawValue())) {
      const target = this.route.snapshot.queryParamMap.get('retour') ?? '/';
      await this.router.navigateByUrl(target);
    }
  }
}
