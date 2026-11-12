import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Page } from '../shared/page';
import { Mission, MissionQuery, NewMission } from './mission.models';

@Injectable({ providedIn: 'root' })
export class MissionApi {
  private readonly http = inject(HttpClient);

  list(query: MissionQuery): Observable<Page<Mission>> {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.search.trim()) {
      params = params.set('search', query.search.trim());
    }
    return this.http.get<Page<Mission>>('/api/missions', { params });
  }

  create(mission: NewMission): Observable<Mission> {
    return this.http.post<Mission>('/api/missions', mission);
  }

  cancel(id: number): Observable<Mission> {
    return this.http.post<Mission>(`/api/missions/${id}/cancel`, null);
  }
}
