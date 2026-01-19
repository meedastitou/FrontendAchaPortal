import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReponseService } from '../../core/services/reponse.service';
import { ReponseComplete } from '../../core/models';

@Component({
  selector: 'app-reponse-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Offres Fournisseurs</h1>
      </div>

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters">
          <div class="filter-group">
            <label>Date debut</label>
            <input type="date" [(ngModel)]="dateDebut" (change)="loadReponses()" />
          </div>

          <div class="filter-group">
            <label>Date fin</label>
            <input type="date" [(ngModel)]="dateFin" (change)="loadReponses()" />
          </div>

          <button class="btn btn-secondary" (click)="resetFilters()">
            Reinitialiser
          </button>
        </div>
      </div>

      <!-- Liste des reponses -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading">Chargement...</div>
        } @else if (reponses().length === 0) {
          <div class="empty">Aucune offre trouvee</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>N RFQ</th>
                <th>Fournisseur</th>
                <th>Date reponse</th>
                <th>Reference</th>
                <th>Articles</th>
                <th>Devise</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (r of reponses(); track r.entete.id) {
                <tr>
                  <td>
                    <a [routerLink]="['/rfq', 'uuid', r.entete.rfq_uuid]" class="code-link">
                      {{ r.numero_rfq }}
                    </a>
                  </td>
                  <td>
                    <div class="fournisseur-cell">
                      <span class="fournisseur-name">{{ r.nom_fournisseur }}</span>
                      <span class="fournisseur-code">{{ r.code_fournisseur }}</span>
                    </div>
                  </td>
                  <td>{{ r.entete.date_reponse | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ r.entete.reference_fournisseur || '-' }}</td>
                  <td>{{ r.details.length }}</td>
                  <td>{{ r.entete.devise }}</td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/reponses', r.entete.id]" class="btn-icon" title="Voir details">
                        V
                      </a>
                      @if (r.entete.fichier_devis_url) {
                        <a [href]="r.entete.fichier_devis_url" target="_blank" class="btn-icon" title="Voir devis">
                          D
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

    .filter-group input {
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
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
export class ReponseListComponent implements OnInit {
  reponses = signal<ReponseComplete[]>([]);
  total = signal(0);
  loading = signal(false);

  dateDebut = '';
  dateFin = '';
  page = 1;
  limit = 20;
  Math = Math;

  constructor(private reponseService: ReponseService) {}

  ngOnInit(): void {
    this.loadReponses();
  }

  loadReponses(): void {
    this.loading.set(true);
    this.reponseService.getAll({
      page: this.page,
      limit: this.limit,
      date_debut: this.dateDebut || undefined,
      date_fin: this.dateFin || undefined
    }).subscribe({
      next: (response) => {
        this.reponses.set(response.reponses);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading reponses:', err);
        this.loading.set(false);
      }
    });
  }

  resetFilters(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.page = 1;
    this.loadReponses();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadReponses();
  }
}
