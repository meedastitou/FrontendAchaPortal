import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutoBCPreviewResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AutoBCService {
  private readonly API_URL = `${environment.apiUrl}/auto-bc`;

  constructor(private http: HttpClient) {}

  /**
   * Obtenir le preview de l'analyse Auto BC
   */
  getPreview(codeFamille: string = '46', periodeHeures: number = 24): Observable<AutoBCPreviewResponse> {
    let params = new HttpParams()
      .set('code_famille', codeFamille)
      .set('periode_heures', periodeHeures.toString());

    return this.http.get<AutoBCPreviewResponse>(`${this.API_URL}/preview`, { params });
  }
}
