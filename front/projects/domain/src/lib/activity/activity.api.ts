import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Activity } from './activity.models';

@Injectable({ providedIn: 'root' })
export class ActivityApi {
  private readonly http = inject(HttpClient);

  get(): Observable<Activity> {
    return this.http.get<Activity>('/api/stats/activity');
  }
}
