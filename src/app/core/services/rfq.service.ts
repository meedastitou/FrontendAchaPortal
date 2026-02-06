import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RFQ, RFQDetail, RFQListResponse, RFQFilters, StatutRFQ } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RFQService {
  private readonly API_URL = `${environment.apiUrl}/rfq`;

  constructor(private http: HttpClient) {}

  getAll(filters: RFQFilters & { page?: number; limit?: number } = {}): Observable<RFQListResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.code_fournisseur) params = params.set('code_fournisseur', filters.code_fournisseur);
    if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
    if (filters.date_fin) params = params.set('date_fin', filters.date_fin);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.code_article) params = params.set('code_article', filters.code_article);
    if (filters.numero_da) params = params.set('numero_da', filters.numero_da);

    return this.http.get<RFQListResponse>(this.API_URL, { params });
  }

  getById(id: number): Observable<RFQDetail> {
    return this.http.get<RFQDetail>(`${this.API_URL}/${id}`);
  }

  getByUuid(uuid: string): Observable<RFQDetail> {
    return this.http.get<RFQDetail>(`${this.API_URL}/uuid/${uuid}`);
  }

  getStatsByStatus(): Observable<{ stats: { statut: StatutRFQ; count: number }[]; total: number }> {
    return this.http.get<{ stats: { statut: StatutRFQ; count: number }[]; total: number }>(
      `${this.API_URL}/stats/by-status`
    );
  }

  getPending(daysOld: number = 7): Observable<{ rfqs: RFQ[]; total: number; days_threshold: number }> {
    return this.http.get<{ rfqs: RFQ[]; total: number; days_threshold: number }>(
      `${this.API_URL}/pending/list`,
      { params: { days_old: daysOld.toString() } }
    );
  }
}
