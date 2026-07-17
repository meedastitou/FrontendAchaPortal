import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ReponseComplete,
  ReponseListResponse,
  ComparaisonResponse,
  Rejet,
  ComparaisonDashboardResponse,
  ReponseAcheteurRequest,
  ReponseAcheteurResponse,
  ReponseAcheteurComplete,
  ReponseAcheteurListResponse,
  ArticlesDAResponse,
  DAListResponse,
  // Saisie Devis RFQ
  SaisieDevisRFQRequest,
  RFQPourSaisie,
  RFQPourSaisieListResponse,
  RFQDetailPourSaisie
} from '../models';

export interface ReponseFilters {
  page?: number;
  limit?: number;
  code_fournisseur?: string;
  search_rfq?: string;
  search_fournisseur?: string;
  search_da?: string;
  date_debut?: string;
  date_fin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReponseService {
  private readonly API_URL = `${environment.apiUrl}/reponses`;
  private readonly API_URL_DEVIS = `${environment.apiUrlDevis}`;

  constructor(private http: HttpClient) {}

  getAll(filters: ReponseFilters = {}): Observable<ReponseListResponse> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.code_fournisseur) params = params.set('code_fournisseur', filters.code_fournisseur);
    if (filters.search_rfq) params = params.set('search_rfq', filters.search_rfq);
    if (filters.search_fournisseur) params = params.set('search_fournisseur', filters.search_fournisseur);
    if (filters.search_da) params = params.set('search_da', filters.search_da);
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

  /**
   * Récupérer le dashboard de comparaison avec tous les articles ayant des réponses
   */
  getComparaisonDashboard(): Observable<ComparaisonDashboardResponse> {
    return this.http.get<ComparaisonDashboardResponse>(`${this.API_URL}/comparaison/dashboard`);
  }

  // ══════════════════════════════════════════════════════════
  // Saisie Manuelle de Réponse (Tables _acheteur)
  // ══════════════════════════════════════════════════════════

  /**
   * Saisir manuellement une réponse acheteur
   */
  saisieManuelle(request: ReponseAcheteurRequest): Observable<ReponseAcheteurResponse> {
    return this.http.post<ReponseAcheteurResponse>(`${this.API_URL}/saisie-manuelle`, request);
  }

  /**
   * Lister les réponses acheteur
   */
  listReponsesAcheteur(page: number = 1, limit: number = 20): Observable<ReponseAcheteurListResponse> {
    return this.http.get<ReponseAcheteurListResponse>(`${this.API_URL}/acheteur/list`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  /**
   * Obtenir une réponse acheteur par ID
   */
  getReponseAcheteur(id: number): Observable<ReponseAcheteurComplete> {
    return this.http.get<ReponseAcheteurComplete>(`${this.API_URL}/acheteur/${id}`);
  }

  /**
   * Récupérer les articles d'une DA pour la saisie manuelle
   */
  getArticlesDA(numeroDA: string): Observable<ArticlesDAResponse> {
    return this.http.get<ArticlesDAResponse>(`${this.API_URL}/da/${numeroDA}/articles`);
  }

  /**
   * Lister les DAs disponibles pour la saisie manuelle
   */
  listDADisponibles(page: number = 1, limit: number = 20): Observable<DAListResponse> {
    return this.http.get<DAListResponse>(`${this.API_URL}/da/list`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  /**
   * Modifier la marque proposee d'un detail de reponse
   */
  updateMarque(detailId: number, marque: string): Observable<{ success: boolean; message: string; nouvelle_marque: string }> {
    return this.http.put<{ success: boolean; message: string; nouvelle_marque: string }>(
      `${this.API_URL}/detail/${detailId}/marque`,
      null,
      { params: { marque } }
    );
  }

  /**
   * Récupérer le PDF du devis fournisseur
   */
  getDevisPDF(filename: string): Observable<Blob> {
    return this.http.get(`${this.API_URL_DEVIS}`, {
      params: { filename },
      responseType: 'blob'
    });
  }

  // ══════════════════════════════════════════════════════════
  // Saisie Devis par RFQ existant
  // ══════════════════════════════════════════════════════════

  /**
   * Lister les RFQs disponibles pour saisie de devis
   */
  getRFQsPourSaisie(
    page: number = 1,
    limit: number = 50,
    codeFournisseur?: string,
    search?: string
  ): Observable<RFQPourSaisieListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (codeFournisseur) {
      params = params.set('code_fournisseur', codeFournisseur);
    }
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<RFQPourSaisieListResponse>(
      `${this.API_URL}/saisie-rfq/rfqs-disponibles`,
      { params }
    );
  }

  /**
   * Obtenir le détail d'un RFQ pour la saisie de devis
   */
  getRFQPourSaisie(rfqUuid: string): Observable<RFQDetailPourSaisie> {
    return this.http.get<RFQDetailPourSaisie>(
      `${this.API_URL}/saisie-rfq/rfq/${rfqUuid}`
    );
  }

  /**
   * Saisir un devis pour un RFQ existant
   */
  saisieDevisRFQ(request: SaisieDevisRFQRequest): Observable<ReponseAcheteurResponse> {
    return this.http.post<ReponseAcheteurResponse>(
      `${this.API_URL}/saisie-rfq`,
      request
    );
  }
}
