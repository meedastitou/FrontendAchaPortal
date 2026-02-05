import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import {
  DashboardStats,
  RFQStatusChart,
  RecentActivity,
  TopFournisseur,
  AlertItem,
  RecentReponse,
  TodayStats
} from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  todayStats = signal<TodayStats | null>(null);
  selectedDate = signal<string>('');
  rfqStatus = signal<RFQStatusChart | null>(null);
  activities = signal<RecentActivity[]>([]);
  topFournisseurs = signal<TopFournisseur[]>([]);
  alerts = signal<AlertItem[]>([]);
  recentReponses = signal<RecentReponse[]>([]);
  selectedReponse = signal<RecentReponse | null>(null);

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

    this.loadTodayStats();

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

    this.dashboardService.getRecentReponses(5).subscribe({
      next: (data) => this.recentReponses.set(data.reponses),
      error: (err) => console.error('Error loading recent reponses:', err)
    });
  }

  showReponseDetails(reponse: RecentReponse): void {
    this.selectedReponse.set(reponse);
  }

  closeReponseDetails(): void {
    this.selectedReponse.set(null);
  }

  formatMontant(montant: number | null): string {
    if (montant === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
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

  loadTodayStats(): void {
    const dateFilter = this.selectedDate() || undefined;
    this.dashboardService.getTodayStats(dateFilter).subscribe({
      next: (data) => this.todayStats.set(data),
      error: (err) => console.error('Error loading today stats:', err)
    });
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate.set(input.value);
    this.loadTodayStats();
  }

  resetToToday(): void {
    this.selectedDate.set('');
    this.loadTodayStats();
  }

  isToday(): boolean {
    return !this.selectedDate();
  }
}
