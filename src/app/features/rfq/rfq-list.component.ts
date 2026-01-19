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
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Demandes de Cotation (RFQ)</h1>
      </div>

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters">
          <div class="filter-group">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="N RFQ ou fournisseur..."
              [(ngModel)]="filters.search"
              (input)="onSearch()"
            />
          </div>

          <div class="filter-group">
            <label>Statut</label>
            <select [(ngModel)]="filters.statut" (change)="loadRFQs()">
              <option [ngValue]="undefined">Tous</option>
              <option value="envoye">Envoye</option>
              <option value="repondu">Repondu</option>
              <option value="rejete">Rejete</option>
              <option value="relance_1">Relance 1</option>
              <option value="relance_2">Relance 2</option>
              <option value="relance_3">Relance 3</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Date debut</label>
            <input type="date" [(ngModel)]="filters.date_debut" (change)="loadRFQs()" />
          </div>

          <div class="filter-group">
            <label>Date fin</label>
            <input type="date" [(ngModel)]="filters.date_fin" (change)="loadRFQs()" />
          </div>

          <button class="btn btn-secondary" (click)="resetFilters()">
            Reinitialiser
          </button>
        </div>
      </div>

      <!-- Stats rapides -->
      <div class="quick-stats">
        <div class="stat-badge envoye">
          <span class="stat-count">{{ statsByStatus()['envoye'] || 0 }}</span>
          <span class="stat-label">Envoyees</span>
        </div>
        <div class="stat-badge repondu">
          <span class="stat-count">{{ statsByStatus()['repondu'] || 0 }}</span>
          <span class="stat-label">Repondues</span>
        </div>
        <div class="stat-badge rejete">
          <span class="stat-count">{{ statsByStatus()['rejete'] || 0 }}</span>
          <span class="stat-label">Rejetees</span>
        </div>
        <div class="stat-badge relance">
          <span class="stat-count">{{ getTotalRelances() }}</span>
          <span class="stat-label">En relance</span>
        </div>
      </div>

      <!-- Tableau -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading">Chargement...</div>
        } @else if (rfqs().length === 0) {
          <div class="empty">Aucune RFQ trouvee</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>N RFQ</th>
                <th>Fournisseur</th>
                <th>Date envoi</th>
                <th>Statut</th>
                <th>Relances</th>
                <th>Articles</th>
                <th>Reponse</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (rfq of rfqs(); track rfq.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/rfq', rfq.id]" class="code-link">
                      {{ rfq.numero_rfq }}
                    </a>
                  </td>
                  <td>
                    <div class="fournisseur-cell">
                      <span class="fournisseur-name">{{ rfq.nom_fournisseur }}</span>
                      <span class="fournisseur-code">{{ rfq.code_fournisseur }}</span>
                    </div>
                  </td>
                  <td>{{ rfq.date_envoi | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + rfq.statut">
                      {{ formatStatut(rfq.statut) }}
                    </span>
                  </td>
                  <td>
                    <span class="relances" [class.warning]="rfq.nb_relances > 0">
                      {{ rfq.nb_relances }}/3
                    </span>
                  </td>
                  <td>{{ rfq.lignes?.length || 0 }}</td>
                  <td>
                    @if (rfq.date_reponse) {
                      <span class="date-reponse">{{ rfq.date_reponse | date:'dd/MM/yyyy' }}</span>
                    } @else {
                      <span class="no-response">En attente</span>
                    }
                  </td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/rfq', rfq.id]" class="btn-icon" title="Voir details">
                        V
                      </a>
                      @if (rfq.statut === 'repondu') {
                        <a [routerLink]="['/reponses', 'rfq', rfq.uuid]" class="btn-icon success" title="Voir offre">
                          O
                        </a>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <span class="pagination-info">
              {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, total()) }} sur {{ total() }}
            </span>
            <div class="pagination-buttons">
              <button [disabled]="page === 1" (click)="goToPage(page - 1)">Precedent</button>
              <button [disabled]="page * limit >= total()" (click)="goToPage(page + 1)">Suivant</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    /* Filters */
    .filters-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-group label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
    }

    .filter-group input,
    .filter-group select {
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      min-width: 160px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    /* Quick Stats */
    .quick-stats {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-badge .stat-count {
      font-size: 20px;
      font-weight: 700;
    }

    .stat-badge .stat-label {
      font-size: 12px;
      color: #6b7280;
    }

    .stat-badge.envoye .stat-count { color: #2563eb; }
    .stat-badge.repondu .stat-count { color: #16a34a; }
    .stat-badge.rejete .stat-count { color: #dc2626; }
    .stat-badge.relance .stat-count { color: #d97706; }

    /* Table */
    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 14px 16px;
      text-align: left;
    }

    .data-table th {
      background: #f9fafb;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .data-table tr:hover td {
      background: #f9fafb;
    }

    .code-link {
      color: #2d5a87;
      font-weight: 500;
      text-decoration: none;
    }

    .code-link:hover {
      text-decoration: underline;
    }

    .fournisseur-cell {
      display: flex;
      flex-direction: column;
    }

    .fournisseur-name {
      font-weight: 500;
    }

    .fournisseur-code {
      font-size: 12px;
      color: #6b7280;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-envoye { background: #dbeafe; color: #2563eb; }
    .badge-vu { background: #e0e7ff; color: #4f46e5; }
    .badge-repondu { background: #dcfce7; color: #16a34a; }
    .badge-rejete { background: #fee2e2; color: #dc2626; }
    .badge-expire { background: #f3f4f6; color: #6b7280; }
    .badge-relance_1, .badge-relance_2, .badge-relance_3 { background: #fef3c7; color: #d97706; }

    .relances {
      font-weight: 500;
    }

    .relances.warning {
      color: #d97706;
    }

    .date-reponse {
      color: #16a34a;
      font-weight: 500;
    }

    .no-response {
      color: #9ca3af;
      font-style: italic;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: #f3f4f6;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.success {
      background: #dcfce7;
      color: #16a34a;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .pagination-info {
      font-size: 13px;
      color: #6b7280;
    }

    .pagination-buttons {
      display: flex;
      gap: 8px;
    }

    .pagination-buttons button {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: white;
      font-size: 13px;
      cursor: pointer;
    }

    .pagination-buttons button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading, .empty {
      padding: 60px;
      text-align: center;
      color: #9ca3af;
    }
  `]
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
