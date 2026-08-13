import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnalyseDashboardResponse,
  ArticleNonSigneListResponse,
  ArticlePrixSuperieurListResponse,
  ArticleMarqueDifferenteListResponse,
  ArticleMarqueInexistanteListResponse,
  ArticlePrixOkMarqueInexListResponse,
  ArticleSansReponseListResponse,
  BlocageFilters,
  DANonSoldeAnalyseResponse
} from '../models/analyse.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyseService {
  private readonly API_URL = `${environment.apiUrl}/analyse`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer le dashboard principal d'analyse
   */
  getDashboard(): Observable<AnalyseDashboardResponse> {
    return this.http.get<AnalyseDashboardResponse>(`${this.API_URL}/dashboard`);
  }

  /**
   * Liste des articles sur DA non signées
   */
  getArticlesNonSignes(filters: BlocageFilters = {}): Observable<ArticleNonSigneListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<ArticleNonSigneListResponse>(
      `${this.API_URL}/blocages/non-signes`,
      { params }
    );
  }

  /**
   * Liste des articles avec prix > tarif
   */
  getArticlesPrixSuperieur(filters: BlocageFilters = {}): Observable<ArticlePrixSuperieurListResponse> {
    let params = this.buildParams(filters);
    if (filters.ecart_min) {
      params = params.set('ecart_min', filters.ecart_min.toString());
    }
    return this.http.get<ArticlePrixSuperieurListResponse>(
      `${this.API_URL}/blocages/prix-superieur`,
      { params }
    );
  }

  /**
   * Liste des articles avec marque différente
   */
  getArticlesMarqueDifferente(filters: BlocageFilters = {}): Observable<ArticleMarqueDifferenteListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<ArticleMarqueDifferenteListResponse>(
      `${this.API_URL}/blocages/marque-differente`,
      { params }
    );
  }

  /**
   * Liste des articles avec marque inexistante dans X3
   */
  getArticlesMarqueInexistante(filters: BlocageFilters = {}): Observable<ArticleMarqueInexistanteListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<ArticleMarqueInexistanteListResponse>(
      `${this.API_URL}/blocages/marque-inexistante`,
      { params }
    );
  }

  /**
   * Liste des articles avec prix OK mais marque inexistante dans X3
   */
  getArticlesPrixOkMarqueInex(filters: BlocageFilters = {}): Observable<ArticlePrixOkMarqueInexListResponse> {
    let params = this.buildParams(filters);
    return this.http.get<ArticlePrixOkMarqueInexListResponse>(
      `${this.API_URL}/blocages/prix-ok-marque-inexistante`,
      { params }
    );
  }

  /**
   * Liste des articles sans réponse fournisseur
   */
  getArticlesSansReponse(filters: BlocageFilters = {}): Observable<ArticleSansReponseListResponse> {
    let params = this.buildParams(filters);
    if (filters.jours_min) {
      params = params.set('jours_min', filters.jours_min.toString());
    }
    return this.http.get<ArticleSansReponseListResponse>(
      `${this.API_URL}/blocages/sans-reponse`,
      { params }
    );
  }

  /**
   * Récupérer l'analyse des DA non soldées avec RFQ sans/avec réponse
   */
  getDANonSoldeAnalyse(): Observable<DANonSoldeAnalyseResponse> {
    return this.http.get<DANonSoldeAnalyseResponse>(
      `${environment.apiUrl}/rfq/da-non-solde/analyse`
    );
  }

  /**
   * Construire les paramètres HTTP à partir des filtres
   */
  private buildParams(filters: BlocageFilters): HttpParams {
    let params = new HttpParams();

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.numero_da) {
      params = params.set('numero_da', filters.numero_da);
    }
    if (filters.code_article) {
      params = params.set('code_article', filters.code_article);
    }

    return params;
  }
}
