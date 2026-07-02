import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LigneCotationAdmin,
  LigneCotationListResponse,
  DesactiverLigneRequest,
  DesactiverLigneResponse,
  ReactiverLigneResponse,
  StatsLignesCotation,
  AdminCotationFilters
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AdminCotationService {
  private readonly API_URL = `${environment.apiUrl}/admin/cotations`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir les statistiques des lignes de cotation
   */
  getStats(): Observable<StatsLignesCotation> {
    return this.http.get<StatsLignesCotation>(`${this.API_URL}/stats`);
  }

  /**
   * Lister les lignes de cotation avec filtres
   */
  getAll(filters: AdminCotationFilters = {}): Observable<LigneCotationListResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.numero_da) params = params.set('numero_da', filters.numero_da);
    if (filters.code_article) params = params.set('code_article', filters.code_article);
    if (filters.actif !== undefined) params = params.set('actif', filters.actif.toString());
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<LigneCotationListResponse>(this.API_URL, { params });
  }

  /**
   * Obtenir une ligne par ID
   */
  getById(id: number): Observable<LigneCotationAdmin> {
    return this.http.get<LigneCotationAdmin>(`${this.API_URL}/${id}`);
  }

  /**
   * Désactiver une ligne de cotation
   */
  desactiver(id: number, data: DesactiverLigneRequest): Observable<DesactiverLigneResponse> {
    return this.http.put<DesactiverLigneResponse>(`${this.API_URL}/${id}/desactiver`, data);
  }

  /**
   * Réactiver une ligne de cotation
   */
  reactiver(id: number): Observable<ReactiverLigneResponse> {
    return this.http.put<ReactiverLigneResponse>(`${this.API_URL}/${id}/reactiver`, {});
  }

  /**
   * Obtenir la liste des DAs pour les filtres
   */
  getDAsList(): Observable<{ das: string[] }> {
    return this.http.get<{ das: string[] }>(`${this.API_URL}/filters/das`);
  }

  /**
   * Obtenir la liste des articles pour les filtres
   */
  getArticlesList(): Observable<{ articles: { code: string; designation: string | null }[] }> {
    return this.http.get<{ articles: { code: string; designation: string | null }[] }>(
      `${this.API_URL}/filters/articles`
    );
  }
}
