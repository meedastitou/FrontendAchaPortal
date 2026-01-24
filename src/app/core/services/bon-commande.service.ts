import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FournisseursDisponiblesResponse,
  LignesDisponiblesResponse,
  GenerateBCRequest,
  GenerateBCResponse,
  BonCommandeResponse,
  BCListResponse,
  ConvertOffreToRPARequest,
  ConvertOffreToRPAResponse
} from '../models/bon-commande.model';

@Injectable({
  providedIn: 'root'
})
export class BonCommandeService {
  private apiUrl = `${environment.apiUrl}/bon-commande`;

  constructor(private http: HttpClient) {}

  /**
   * Liste des fournisseurs ayant des réponses disponibles pour BC
   */
  getFournisseursDisponibles(): Observable<FournisseursDisponiblesResponse> {
    return this.http.get<FournisseursDisponiblesResponse>(
      `${this.apiUrl}/fournisseurs-disponibles`
    );
  }

  /**
   * Récupérer toutes les lignes disponibles d'un fournisseur
   */
  getLignesFournisseur(codeFournisseur: string): Observable<LignesDisponiblesResponse> {
    return this.http.get<LignesDisponiblesResponse>(
      `${this.apiUrl}/lignes/${codeFournisseur}`
    );
  }

  /**
   * Générer un bon de commande
   */
  genererBC(request: GenerateBCRequest): Observable<GenerateBCResponse> {
    return this.http.post<GenerateBCResponse>(
      `${this.apiUrl}/generer`,
      request
    );
  }

  /**
   * Liste des bons de commande
   */
  getAll(page: number = 1, limit: number = 20, statut?: string, codeFournisseur?: string): Observable<BCListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (statut) {
      params = params.set('statut', statut);
    }
    if (codeFournisseur) {
      params = params.set('code_fournisseur', codeFournisseur);
    }

    return this.http.get<BCListResponse>(this.apiUrl, { params });
  }

  /**
   * Détail d'un bon de commande
   */
  getByNumero(numeroBC: string): Observable<BonCommandeResponse> {
    return this.http.get<BonCommandeResponse>(`${this.apiUrl}/${numeroBC}`);
  }

  /**
   * Valider un bon de commande
   */
  valider(numeroBC: string): Observable<BonCommandeResponse> {
    return this.http.post<BonCommandeResponse>(
      `${this.apiUrl}/${numeroBC}/valider`,
      {}
    );
  }

  /**
   * Convertir une offre fournisseur en BC via RPA (Sage X3)
   */
  convertToRPA(request: ConvertOffreToRPARequest): Observable<ConvertOffreToRPAResponse> {
    return this.http.post<ConvertOffreToRPAResponse>(
      `${this.apiUrl}/convert-to-rpa`,
      request
    );
  }
}
