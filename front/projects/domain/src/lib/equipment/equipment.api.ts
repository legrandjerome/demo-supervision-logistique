import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Equipment, EquipmentStatus } from './equipment.models';

@Injectable({ providedIn: 'root' })
export class EquipmentApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>('/api/equipments');
  }

  changeStatus(id: number, status: EquipmentStatus): Observable<Equipment> {
    return this.http.patch<Equipment>(`/api/equipments/${id}/status`, { status });
  }
}
