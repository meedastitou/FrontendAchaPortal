import { Injectable } from '@angular/core';
import { DANonSoldee, DasFilters } from '../models/DAs-non-soldes.model';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DasNonSoldesServices {

  private readonly API_URL = `${environment.apiUrl}/das`;

  constructor(private http: HttpClient) {}

  getDasNonSoldees(filters: DasFilters): Observable<DANonSoldee[]> {
    let params = new HttpParams().set('date_debut', filters.dateDebut);

    if (filters.famille) params = params.set('famille', filters.famille);
    if (filters.article) params = params.set('article', filters.article);
    if (filters.numeroDa) params = params.set('numero_da', filters.numeroDa);

    return this.http.get<DANonSoldee[]>(`${this.API_URL}/non-soldees`, { params });
  }
  
  transfererDA(da: DANonSoldee): Observable<any> {
    const payload = {
      numero_da: da.DA,
      code_article: da.Article,
      designation_article: da['DésignationArticle'],
      quantite: da.QteDA,
      unite: da.Unite,
      marque_souhaitee: da.marque
    };
    return this.http.post(`${this.API_URL}/transferer`, payload);
  }

  
}
