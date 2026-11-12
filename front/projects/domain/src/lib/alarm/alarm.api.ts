import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Alarm } from './alarm.models';

@Injectable({ providedIn: 'root' })
export class AlarmApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Alarm[]> {
    return this.http.get<Alarm[]>('/api/alarms');
  }

  acknowledge(id: number): Observable<Alarm> {
    return this.http.post<Alarm>(`/api/alarms/${id}/acknowledge`, null);
  }
}
