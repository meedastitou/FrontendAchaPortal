import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnnulationBC,
  AnnulationBCCreate,
  AnnulationBCResponse,
  AnnulationBCListResponse,
  AnnulationBCFilters
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AnnulationBCService {
  private readonly API_URL = `${environment.apiUrl}/annulation-bc`;

  constructor(private http: HttpClient) {}

  create(data: AnnulationBCCreate): Observable<AnnulationBCResponse> {
    return this.http.post<AnnulationBCResponse>(this.API_URL, data);
  }

  getAll(filters: AnnulationBCFilters = {}): Observable<AnnulationBCListResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.numero_commande) params = params.set('numero_commande', filters.numero_commande);

    return this.http.get<AnnulationBCListResponse>(this.API_URL, { params });
  }

  getById(id: number): Observable<AnnulationBC> {
    return this.http.get<AnnulationBC>(`${this.API_URL}/${id}`);
  }
}
