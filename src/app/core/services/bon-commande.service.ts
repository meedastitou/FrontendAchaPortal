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
  ConvertOffreToRPAResponse,
  BCX3ListResponse,
  // Caneva BC
  GenerateCanevaBCRequest,
  GenerateCanevaBCResponse,
  // RPA
  EnvoyerBCRPAResponse
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

  /**
   * Récupérer les BC créés dans Sage X3 via RPA
   */
  getBCX3RPA(page: number = 1, limit: number = 20): Observable<BCX3ListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<BCX3ListResponse>(
      `${environment.apiUrl}/auto-bc/bc-x3-rpa`,
      { params }
    );
  }

  /**
   * Caneva BC - Liste des DA disponibles depuis X3
   */
  getCanevaDADisponibles(): Observable<{ da_list: string[]; total: number }> {
    return this.http.get<{ da_list: string[]; total: number }>(
      `${this.apiUrl}/caneva/da-disponibles`
    );
  }

  /**
   * Caneva BC - Articles d'une DA depuis X3
   */
  getCanevaArticlesDA(numeroDA: string): Observable<{
    numero_da: string;
    articles: Array<{
      numero_da: string;
      code_article: string;
      designation_article: string;
      quantite: number;
      marque: string;
      unite: string;
      famille: string;
    }>;
    total: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/caneva/da/${numeroDA}/articles`);
  }

  /**
   * Caneva BC - Tarif max pour un article depuis X3
   */
  getCanevaTarifMax(codeArticle: string): Observable<{ code_article: string; tarif_max: number | null }> {
    return this.http.get<{ code_article: string; tarif_max: number | null }>(
      `${this.apiUrl}/caneva/article/${codeArticle}/tarif-max`
    );
  }

  /**
   * Caneva BC - Marques disponibles pour un article depuis X3
   */
  getCanevaMarques(codeArticle: string): Observable<{ code_article: string; marques: string[]; total: number }> {
    return this.http.get<{ code_article: string; marques: string[]; total: number }>(
      `${this.apiUrl}/caneva/article/${codeArticle}/marques`
    );
  }

  /**
   * Envoyer les données Caneva BC directement au RPA (sans enregistrement en base)
   */
  genererCanevaBC(request: GenerateCanevaBCRequest): Observable<EnvoyerBCRPAResponse> {
    return this.http.post<EnvoyerBCRPAResponse>(
      `${this.apiUrl}/caneva`,
      request
    );
  }

  /**
   * Envoyer un BC au RPA (Sage X3)
   */
  envoyerRPA(numeroBC: string): Observable<EnvoyerBCRPAResponse> {
    return this.http.post<EnvoyerBCRPAResponse>(
      `${this.apiUrl}/${numeroBC}/envoyer-rpa`,
      {}
    );
  }
}
