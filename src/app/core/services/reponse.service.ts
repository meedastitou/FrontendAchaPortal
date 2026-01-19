import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReponseComplete, ReponseListResponse, ComparaisonResponse, Rejet } from '../models';

export interface ReponseFilters {
  page?: number;
  limit?: number;
  code_fournisseur?: string;
  date_debut?: string;
  date_fin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReponseService {
  private readonly API_URL = `${environment.apiUrl}/reponses`;

  constructor(private http: HttpClient) {}

  getAll(filters: ReponseFilters = {}): Observable<ReponseListResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.code_fournisseur) params = params.set('code_fournisseur', filters.code_fournisseur);
    if (filters.date_debut) params = params.set('date_debut', filters.date_debut);
    if (filters.date_fin) params = params.set('date_fin', filters.date_fin);

    return this.http.get<ReponseListResponse>(this.API_URL, { params });
  }

  getById(id: number): Observable<ReponseComplete> {
    return this.http.get<ReponseComplete>(`${this.API_URL}/${id}`);
  }

  getByRFQ(rfqUuid: string): Observable<ReponseComplete> {
    return this.http.get<ReponseComplete>(`${this.API_URL}/rfq/${rfqUuid}`);
  }

  compareOffersForArticle(codeArticle: string, numeroDA?: string): Observable<ComparaisonResponse> {
    let params = new HttpParams();
    if (numeroDA) params = params.set('numero_da', numeroDA);

    return this.http.get<ComparaisonResponse>(
      `${this.API_URL}/comparaison/article/${codeArticle}`,
      { params }
    );
  }

  getRejets(page: number = 1, limit: number = 20): Observable<{ rejets: Rejet[]; total: number; page: number; limit: number }> {
    return this.http.get<{ rejets: Rejet[]; total: number; page: number; limit: number }>(
      `${this.API_URL}/rejets/list`,
      { params: { page: page.toString(), limit: limit.toString() } }
    );
  }
}
