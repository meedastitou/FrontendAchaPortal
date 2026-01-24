import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RFQService } from '../../core/services/rfq.service';
import { RFQ, RFQFilters, StatutRFQ } from '../../core/models';

@Component({
  selector: 'app-rfq-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './rfq-list.component.html',
  styleUrl: './rfq-list.component.scss'
})
export class RFQListComponent implements OnInit {
  rfqs = signal<RFQ[]>([]);
  total = signal(0);
  loading = signal(false);
  statsByStatus = signal<Record<string, number>>({});

  filters: RFQFilters = {
    search: '',
    statut: undefined,
    date_debut: undefined,
    date_fin: undefined
  };

  page = 1;
  limit = 20;
  Math = Math;

  private searchTimeout: any;

  constructor(private rfqService: RFQService) {}

  ngOnInit(): void {
    this.loadRFQs();
    this.loadStats();
  }

  loadRFQs(): void {
    this.loading.set(true);
    this.rfqService.getAll({ ...this.filters, page: this.page, limit: this.limit }).subscribe({
      next: (response) => {
        this.rfqs.set(response.rfqs);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading RFQs:', err);
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.rfqService.getStatsByStatus().subscribe({
      next: (response) => {
        const stats: Record<string, number> = {};
        response.stats.forEach(s => stats[s.statut] = s.count);
        this.statsByStatus.set(stats);
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.loadRFQs();
    }, 300);
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      statut: undefined,
      date_debut: undefined,
      date_fin: undefined
    };
    this.page = 1;
    this.loadRFQs();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadRFQs();
  }

  getTotalRelances(): number {
    const stats = this.statsByStatus();
    return (stats['relance_1'] || 0) + (stats['relance_2'] || 0) + (stats['relance_3'] || 0);
  }

  formatStatut(statut: string): string {
    const map: Record<string, string> = {
      envoye: 'Envoye',
      vu: 'Vu',
      repondu: 'Repondu',
      rejete: 'Rejete',
      expire: 'Expire',
      relance_1: 'Relance 1',
      relance_2: 'Relance 2',
      relance_3: 'Relance 3'
    };
    return map[statut] || statut;
  }
}
