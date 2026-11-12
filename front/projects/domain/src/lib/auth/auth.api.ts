import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Credentials, LoginResponse, User } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(credentials: Credentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/login', credentials);
  }

  me(): Observable<User> {
    return this.http.get<User>('/api/me');
  }
}
