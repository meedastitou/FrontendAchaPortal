import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DerniereReception {
  code_article: string;
  designation: string;
  code_fournisseur: string;
  nom_fournisseur?: string;
  prix: number;
  devise: string;
  date_reception: string;
}

export interface HistoriqueReception {
  code_article: string;
  receptions: DerniereReception[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class X3Service {
  private readonly API_URL = `${environment.apiUrl}/x3`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer la dernière réception d'un article depuis Sage X3
   */
  getDerniereReception(codeArticle: string): Observable<DerniereReception> {
    return this.http.get<DerniereReception>(`${this.API_URL}/receptions/derniere/${codeArticle}`);
  }

  /**
   * Récupérer l'historique des réceptions d'un article
   */
  getHistoriqueReceptions(codeArticle: string, limit: number = 10): Observable<HistoriqueReception> {
    return this.http.get<HistoriqueReception>(
      `${this.API_URL}/receptions/historique/${codeArticle}`,
      { params: { limit: limit.toString() } }
    );
  }
}
