import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardStats,
  DashboardStatsDetailed,
  RFQStatusChart,
  RecentActivity,
  TopFournisseur,
  AlertItem
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/stats`);
  }

  getDetailedStats(): Observable<DashboardStatsDetailed> {
    return this.http.get<DashboardStatsDetailed>(`${this.API_URL}/stats/detailed`);
  }

  getRFQStatusChart(): Observable<RFQStatusChart> {
    return this.http.get<RFQStatusChart>(`${this.API_URL}/rfq-status`);
  }

  getRecentActivity(limit: number = 10): Observable<{ activities: RecentActivity[]; total: number }> {
    return this.http.get<{ activities: RecentActivity[]; total: number }>(
      `${this.API_URL}/recent-activity`,
      { params: { limit: limit.toString() } }
    );
  }

  getTopFournisseurs(limit: number = 5): Observable<{ fournisseurs: TopFournisseur[] }> {
    return this.http.get<{ fournisseurs: TopFournisseur[] }>(
      `${this.API_URL}/top-fournisseurs`,
      { params: { limit: limit.toString() } }
    );
  }

  getAlerts(limit: number = 10): Observable<{ alerts: AlertItem[]; total: number }> {
    return this.http.get<{ alerts: AlertItem[]; total: number }>(
      `${this.API_URL}/alerts`,
      { params: { limit: limit.toString() } }
    );
  }
}
