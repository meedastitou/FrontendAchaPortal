import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Fournisseur,
  FournisseurCreate,
  FournisseurUpdate,
  FournisseurListResponse,
  BlacklistRequest,
  StatutFournisseur
} from '../models';

export interface FournisseurFilters {
  page?: number;
  limit?: number;
  statut?: StatutFournisseur;
  blacklist?: boolean;
  search?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FournisseurService {
  private readonly API_URL = `${environment.apiUrl}/fournisseurs`;

  constructor(private http: HttpClient) {}

  getAll(filters: FournisseurFilters = {}): Observable<FournisseurListResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.blacklist !== undefined) params = params.set('blacklist', filters.blacklist.toString());
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<FournisseurListResponse>(this.API_URL, { params });
  }

  getByCode(code: string): Observable<Fournisseur> {
    return this.http.get<Fournisseur>(`${this.API_URL}/${code}`);
  }

  create(data: FournisseurCreate): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(this.API_URL, data);
  }

  update(code: string, data: FournisseurUpdate): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.API_URL}/${code}`, data);
  }

  blacklist(code: string, data: BlacklistRequest): Observable<{ success: boolean; message: string; fournisseur: Fournisseur }> {
    return this.http.post<{ success: boolean; message: string; fournisseur: Fournisseur }>(
      `${this.API_URL}/${code}/blacklist`,
      data
    );
  }

  unblacklist(code: string): Observable<{ success: boolean; message: string; fournisseur: Fournisseur }> {
    return this.http.delete<{ success: boolean; message: string; fournisseur: Fournisseur }>(
      `${this.API_URL}/${code}/blacklist`
    );
  }

  getRFQHistory(code: string, page: number = 1, limit: number = 20): Observable<any> {
    return this.http.get(`${this.API_URL}/${code}/rfq`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }
}
