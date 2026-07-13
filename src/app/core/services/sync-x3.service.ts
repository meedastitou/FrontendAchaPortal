import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SyncX3Request,
  SyncX3Response,
  StatsX3,
  DAListX3Response,
  DAListX3Filters,
  LogSyncX3ListResponse,
  StatutSync,
  StatsAlertesX3,
  ReponseDANonSigneeListResponse,
  OffrePrixSuperieurTarifListResponse,
  OffreMarqueDifferenteListResponse,
  DANonSoldeeX3ListResponse
} from '../models/sync-x3.model';

@Injectable({
  providedIn: 'root'
})
export class SyncX3Service {
  private readonly API_URL = `${environment.apiUrl}/sync-x3`;

  constructor(private http: HttpClient) {}

  /**
   * Lancer une synchronisation avec Sage X3
   */
  synchroniser(request: SyncX3Request = {}): Observable<SyncX3Response> {
    return this.http.post<SyncX3Response>(`${this.API_URL}/synchroniser`, request);
  }

  /**
   * Synchroniser une DA spécifique
   */
  synchroniserDA(numeroDA: string): Observable<SyncX3Response> {
    return this.http.post<SyncX3Response>(`${this.API_URL}/synchroniser-da/${numeroDA}`, {});
  }

  /**
   * Obtenir les statistiques des statuts X3
   */
  getStats(): Observable<StatsX3> {
    return this.http.get<StatsX3>(`${this.API_URL}/stats`);
  }

  /**
   * Lister les DA avec leurs statuts X3
   */
  getDemandesAchat(filters: DAListX3Filters = {}): Observable<DAListX3Response> {
    let params = new HttpParams();

    if (filters.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters.x3_signe !== undefined) {
      params = params.set('x3_signe', filters.x3_signe.toString());
    }
    if (filters.x3_solde !== undefined) {
      params = params.set('x3_solde', filters.x3_solde.toString());
    }
    if (filters.statut_x3) {
      params = params.set('statut_x3', filters.statut_x3);
    }
    if (filters.numero_da) {
      params = params.set('numero_da', filters.numero_da);
    }
    if (filters.code_article) {
      params = params.set('code_article', filters.code_article);
    }
    if (filters.include_stats) {
      params = params.set('include_stats', 'true');
    }

    return this.http.get<DAListX3Response>(`${this.API_URL}/demandes-achat`, { params });
  }

  /**
   * Obtenir l'historique des synchronisations
   */
  getLogs(page: number = 1, limit: number = 20, statut?: StatutSync): Observable<LogSyncX3ListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (statut) {
      params = params.set('statut', statut);
    }

    return this.http.get<LogSyncX3ListResponse>(`${this.API_URL}/logs`, { params });
  }

  // ══════════════════════════════════════════════════════════════
  // ALERTES ET ANALYSES
  // ══════════════════════════════════════════════════════════════

  /**
   * Statistiques des alertes
   */
  getStatsAlertes(): Observable<StatsAlertesX3> {
    return this.http.get<StatsAlertesX3>(`${this.API_URL}/alertes/stats`);
  }

  /**
   * Réponses sur DA non signées
   */
  getReponsesDANonSignees(
    page: number = 1,
    limit: number = 20,
    numeroDA?: string,
    codeArticle?: string
  ): Observable<ReponseDANonSigneeListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (numeroDA) {
      params = params.set('numero_da', numeroDA);
    }
    if (codeArticle) {
      params = params.set('code_article', codeArticle);
    }

    return this.http.get<ReponseDANonSigneeListResponse>(
      `${this.API_URL}/alertes/reponses-da-non-signees`,
      { params }
    );
  }

  /**
   * Offres avec prix > tarif X3
   */
  getOffresPrixSuperieurTarif(
    page: number = 1,
    limit: number = 20,
    ecartMinPourcent: number = 0
  ): Observable<OffrePrixSuperieurTarifListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('ecart_min_pourcent', ecartMinPourcent.toString());

    return this.http.get<OffrePrixSuperieurTarifListResponse>(
      `${this.API_URL}/alertes/offres-prix-superieur-tarif`,
      { params }
    );
  }

  /**
   * Offres avec marque différente
   */
  getOffresMarqueDifferente(
    page: number = 1,
    limit: number = 20,
    verifierX3: boolean = true
  ): Observable<OffreMarqueDifferenteListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('verifier_x3', verifierX3.toString());

    return this.http.get<OffreMarqueDifferenteListResponse>(
      `${this.API_URL}/alertes/offres-marque-differente`,
      { params }
    );
  }

  /**
   * DA non soldées depuis X3
   */
  getDANonSoldeesX3(
    page: number = 1,
    limit: number = 50,
    dateMin?: string
  ): Observable<DANonSoldeeX3ListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (dateMin) {
      params = params.set('date_min', dateMin);
    }

    return this.http.get<DANonSoldeeX3ListResponse>(
      `${this.API_URL}/x3/da-non-soldees`,
      { params }
    );
  }
}
