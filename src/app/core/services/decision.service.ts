import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DAAttenteListResponse,
  DADecisionDetail,
  CreateCommandeRequest,
  CreateCommandeResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class DecisionService {
  private readonly API_URL = `${environment.apiUrl}/decision`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir la liste des DA en attente de décision
   */
  getDAEnAttente(
    page: number = 1,
    limit: number = 20,
    priorite?: string
  ): Observable<DAAttenteListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (priorite) {
      params = params.set('priorite', priorite);
    }

    return this.http.get<DAAttenteListResponse>(`${this.API_URL}/da-en-attente`, { params });
  }

  /**
   * Obtenir le détail d'une DA pour prise de décision
   */
  getDADetail(numeroDA: string): Observable<DADecisionDetail> {
    return this.http.get<DADecisionDetail>(`${this.API_URL}/da/${numeroDA}`);
  }

  /**
   * Créer une commande
   */
  creerCommande(request: CreateCommandeRequest): Observable<CreateCommandeResponse> {
    return this.http.post<CreateCommandeResponse>(`${this.API_URL}/creer-commande`, request);
  }
}
