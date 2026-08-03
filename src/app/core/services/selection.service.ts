import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SelectionArticle,
  SelectionArticleCreate,
  SelectionArticleUpdate,
  SelectionAutoResponse,
  PreBCDashboardResponse,
  GenererBCFromPreBCRequest,
  GenererBCFromPreBCResponse
} from '../models';

export interface SelectionFilters {
  statut?: string;
  code_fournisseur?: string;
  numero_da?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private readonly API_URL = `${environment.apiUrl}/selections`;

  constructor(private http: HttpClient) {}

  /**
   * Selection automatique du meilleur prix pour tous les articles
   */
  selectionAuto(): Observable<SelectionAutoResponse> {
    return this.http.post<SelectionAutoResponse>(`${this.API_URL}/auto`, {});
  }

  /**
   * Lister toutes les selections
   */
  getAll(filters: SelectionFilters = {}): Observable<SelectionArticle[]> {
    let params = new HttpParams();

    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.code_fournisseur) params = params.set('code_fournisseur', filters.code_fournisseur);
    if (filters.numero_da) params = params.set('numero_da', filters.numero_da);

    return this.http.get<SelectionArticle[]>(this.API_URL, { params });
  }

  /**
   * Creer une selection manuelle
   */
  create(selection: SelectionArticleCreate): Observable<SelectionArticle> {
    return this.http.post<SelectionArticle>(this.API_URL, selection);
  }

  /**
   * Modifier une selection (changer de fournisseur)
   */
  update(id: number, update: SelectionArticleUpdate): Observable<SelectionArticle> {
    return this.http.put<SelectionArticle>(`${this.API_URL}/${id}`, update);
  }

  /**
   * Supprimer une selection
   */
  delete(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/${id}`);
  }

  /**
   * Recuperer le dashboard Pre-BC (groupe par fournisseur)
   */
  getPreBCDashboard(): Observable<PreBCDashboardResponse> {
    return this.http.get<PreBCDashboardResponse>(`${this.API_URL}/pre-bc`);
  }

  /**
   * Generer un BC depuis les selections Pre-BC
   */
  genererBC(request: GenererBCFromPreBCRequest): Observable<GenererBCFromPreBCResponse> {
    return this.http.post<GenererBCFromPreBCResponse>(`${this.API_URL}/generer-bc`, request);
  }
}
