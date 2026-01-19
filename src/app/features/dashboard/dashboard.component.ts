import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardStats,
  RFQStatusChart,
  RecentActivity,
  TopFournisseur,
  AlertItem
} from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <span>DA</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.total_da_actives || 0 }}</span>
            <span class="stat-label">DA Actives</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange">
            <span>RFQ</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.rfq_en_attente || 0 }}</span>
            <span class="stat-label">RFQ en attente</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">
            <span>OK</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.rfq_repondues || 0 }}</span>
            <span class="stat-label">RFQ Repondues</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple">
            <span>F</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.fournisseurs_actifs || 0 }}</span>
            <span class="stat-label">Fournisseurs actifs</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon red">
            <span>BL</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.fournisseurs_blacklistes || 0 }}</span>
            <span class="stat-label">Blacklistes</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon teal">
            <span>%</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats()?.taux_reponse_moyen || 0 }}%</span>
            <span class="stat-label">Taux reponse moyen</span>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- RFQ Status Chart -->
        <div class="card">
          <div class="card-header">
            <h3>Repartition des RFQ</h3>
          </div>
          <div class="card-body">
            @if (rfqStatus()) {
              <div class="status-chart">
                <div class="status-item">
                  <div class="status-bar">
                    <div class="status-fill envoye" [style.width.%]="getStatusPercent('envoye')"></div>
                  </div>
                  <span class="status-label">Envoyees</span>
                  <span class="status-value">{{ rfqStatus()?.envoye || 0 }}</span>
                </div>
                <div class="status-item">
                  <div class="status-bar">
                    <div class="status-fill repondu" [style.width.%]="getStatusPercent('repondu')"></div>
                  </div>
                  <span class="status-label">Repondues</span>
                  <span class="status-value">{{ rfqStatus()?.repondu || 0 }}</span>
                </div>
                <div class="status-item">
                  <div class="status-bar">
                    <div class="status-fill rejete" [style.width.%]="getStatusPercent('rejete')"></div>
                  </div>
                  <span class="status-label">Rejetees</span>
                  <span class="status-value">{{ rfqStatus()?.rejete || 0 }}</span>
                </div>
                <div class="status-item">
                  <div class="status-bar">
                    <div class="status-fill relance" [style.width.%]="getStatusPercent('relance')"></div>
                  </div>
                  <span class="status-label">En relance</span>
                  <span class="status-value">{{ getTotalRelances() }}</span>
                </div>
              </div>
            } @else {
              <div class="loading">Chargement...</div>
            }
          </div>
        </div>

        <!-- Top Fournisseurs -->
        <div class="card">
          <div class="card-header">
            <h3>Top Fournisseurs</h3>
            <a routerLink="/fournisseurs" class="view-all">Voir tout</a>
          </div>
          <div class="card-body">
            @if (topFournisseurs().length > 0) {
              <div class="top-list">
                @for (f of topFournisseurs(); track f.code_fournisseur) {
                  <div class="top-item">
                    <div class="top-rank">{{ $index + 1 }}</div>
                    <div class="top-info">
                      <span class="top-name">{{ f.nom_fournisseur }}</span>
                      <span class="top-code">{{ f.code_fournisseur }}</span>
                    </div>
                    <div class="top-stats">
                      <span class="top-rate">{{ f.taux_reponse }}%</span>
                      <div class="stars">
                        @for (star of getStars(f.note_performance); track $index) {
                          <span class="star" [class.filled]="star">*</span>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty">Aucun fournisseur</div>
            }
          </div>
        </div>

        <!-- Activite Recente -->
        <div class="card">
          <div class="card-header">
            <h3>Activite Recente</h3>
          </div>
          <div class="card-body">
            @if (activities().length > 0) {
              <div class="activity-list">
                @for (activity of activities(); track activity.id) {
                  <div class="activity-item">
                    <div class="activity-icon" [class]="activity.type">
                      {{ activity.type === 'rfq_envoyee' ? 'E' : 'R' }}
                    </div>
                    <div class="activity-content">
                      <span class="activity-desc">{{ activity.description }}</span>
                      <span class="activity-date">{{ formatDate(activity.date) }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty">Aucune activite recente</div>
            }
          </div>
        </div>

        <!-- Alertes -->
        <div class="card">
          <div class="card-header">
            <h3>Alertes</h3>
            <span class="alert-badge" [class.has-alerts]="alerts().length > 0">
              {{ alerts().length }}
            </span>
          </div>
          <div class="card-body">
            @if (alerts().length > 0) {
              <div class="alert-list">
                @for (alert of alerts(); track alert.id) {
                  <a [routerLink]="alert.lien" class="alert-item" [class]="alert.type">
                    <div class="alert-icon">{{ alert.type === 'warning' ? '!' : 'i' }}</div>
                    <div class="alert-content">
                      <span class="alert-title">{{ alert.titre }}</span>
                      <span class="alert-message">{{ alert.message }}</span>
                    </div>
                  </a>
                }
              </div>
            } @else {
              <div class="empty success">Aucune alerte</div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
      color: white;
    }

    .stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-icon.orange { background: linear-gradient(135deg, #f97316, #ea580c); }
    .stat-icon.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    .stat-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .stat-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-label {
      font-size: 13px;
      color: #6b7280;
    }

    /* Dashboard Grid */
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .view-all {
      font-size: 13px;
      color: #2d5a87;
      text-decoration: none;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .card-body {
      padding: 20px;
    }

    /* Status Chart */
    .status-chart {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .status-item {
      display: grid;
      grid-template-columns: 1fr auto auto;
      align-items: center;
      gap: 12px;
    }

    .status-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .status-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .status-fill.envoye { background: #3b82f6; }
    .status-fill.repondu { background: #22c55e; }
    .status-fill.rejete { background: #ef4444; }
    .status-fill.relance { background: #f97316; }

    .status-label {
      font-size: 13px;
      color: #6b7280;
      min-width: 80px;
    }

    .status-value {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      min-width: 30px;
      text-align: right;
    }

    /* Top Fournisseurs */
    .top-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .top-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .top-rank {
      width: 28px;
      height: 28px;
      background: #2d5a87;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .top-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .top-name {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .top-code {
      font-size: 12px;
      color: #6b7280;
    }

    .top-stats {
      text-align: right;
    }

    .top-rate {
      font-size: 14px;
      font-weight: 600;
      color: #22c55e;
    }

    .stars {
      font-size: 12px;
      color: #d1d5db;
    }

    .star.filled {
      color: #fbbf24;
    }

    /* Activity List */
    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    .activity-icon.rfq_envoyee { background: #3b82f6; }
    .activity-icon.reponse_recue { background: #22c55e; }

    .activity-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .activity-desc {
      font-size: 13px;
      color: #1f2937;
    }

    .activity-date {
      font-size: 12px;
      color: #9ca3af;
    }

    /* Alerts */
    .alert-badge {
      background: #e5e7eb;
      color: #6b7280;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }

    .alert-badge.has-alerts {
      background: #fef2f2;
      color: #dc2626;
    }

    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .alert-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      text-decoration: none;
      transition: all 0.2s;
    }

    .alert-item.warning {
      background: #fffbeb;
      border: 1px solid #fef3c7;
    }

    .alert-item.info {
      background: #eff6ff;
      border: 1px solid #dbeafe;
    }

    .alert-item:hover {
      transform: translateX(4px);
    }

    .alert-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
    }

    .alert-item.warning .alert-icon {
      background: #fbbf24;
      color: white;
    }

    .alert-item.info .alert-icon {
      background: #3b82f6;
      color: white;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .alert-title {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
    }

    .alert-message {
      font-size: 12px;
      color: #6b7280;
    }

    /* Empty & Loading */
    .empty, .loading {
      text-align: center;
      padding: 30px;
      color: #9ca3af;
      font-size: 14px;
    }

    .empty.success {
      color: #22c55e;
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  rfqStatus = signal<RFQStatusChart | null>(null);
  activities = signal<RecentActivity[]>([]);
  topFournisseurs = signal<TopFournisseur[]>([]);
  alerts = signal<AlertItem[]>([]);

  private totalRfq = 0;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading stats:', err)
    });

    this.dashboardService.getRFQStatusChart().subscribe({
      next: (data) => {
        this.rfqStatus.set(data);
        this.totalRfq = Object.values(data).reduce((sum, val) => sum + (val || 0), 0);
      },
      error: (err) => console.error('Error loading RFQ status:', err)
    });

    this.dashboardService.getRecentActivity(5).subscribe({
      next: (data) => this.activities.set(data.activities),
      error: (err) => console.error('Error loading activities:', err)
    });

    this.dashboardService.getTopFournisseurs(5).subscribe({
      next: (data) => this.topFournisseurs.set(data.fournisseurs),
      error: (err) => console.error('Error loading top fournisseurs:', err)
    });

    this.dashboardService.getAlerts(5).subscribe({
      next: (data) => this.alerts.set(data.alerts),
      error: (err) => console.error('Error loading alerts:', err)
    });
  }

  getStatusPercent(status: string): number {
    if (!this.rfqStatus() || this.totalRfq === 0) return 0;
    const value = (this.rfqStatus() as any)[status] || 0;
    return (value / this.totalRfq) * 100;
  }

  getTotalRelances(): number {
    const status = this.rfqStatus();
    if (!status) return 0;
    return (status.relance_1 || 0) + (status.relance_2 || 0) + (status.relance_3 || 0);
  }

  getStars(note: number): boolean[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= Math.round(note || 0));
    }
    return stars;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return "A l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  }
}
