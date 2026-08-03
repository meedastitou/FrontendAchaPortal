import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCotationService } from '../../core/services/admin-cotation.service';
import {
  LigneCotationAdmin,
  StatsLignesCotation,
  AdminCotationFilters
} from '../../core/models';

@Component({
  selector: 'app-admin-cotations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Gestion des Lignes de Cotation</h1>
        <span class="admin-badge">Admin</span>
      </div>

      <!-- Stats Cards -->
      @if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats()!.total_lignes }}</span>
            <span class="stat-label">Total Lignes</span>
          </div>
          <div class="stat-card success">
            <span class="stat-value">{{ stats()!.lignes_actives }}</span>
            <span class="stat-label">Actives</span>
          </div>
          <div class="stat-card danger">
            <span class="stat-value">{{ stats()!.lignes_desactivees }}</span>
            <span class="stat-label">Desactivees</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats()!.total_das }}</span>
            <span class="stat-label">DAs</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats()!.total_articles }}</span>
            <span class="stat-label">Articles</span>
          </div>
        </div>
      }

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters">
          <div class="filter-group">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="DA, article, RFQ..."
              [(ngModel)]="filters.search"
              (input)="onSearch()"
            />
          </div>

          <div class="filter-group">
            <label>Numero DA</label>
            <select [(ngModel)]="filters.numero_da" (change)="loadLignes()">
              <option value="">Toutes les DAs</option>
              @for (da of dasList(); track da) {
                <option [value]="da">{{ da }}</option>
              }
            </select>
          </div>

          <div class="filter-group">
            <label>Statut</label>
            <select [(ngModel)]="filters.actif" (change)="loadLignes()">
              <option [ngValue]="undefined">Tous</option>
              <option [ngValue]="true">Actives</option>
              <option [ngValue]="false">Desactivees</option>
            </select>
          </div>

          <button class="btn btn-secondary" (click)="resetFilters()">
            Reinitialiser
          </button>
        </div>
      </div>

      <!-- Tableau -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading">Chargement...</div>
        } @else if (lignes().length === 0) {
          <div class="empty">Aucune ligne de cotation trouvee</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>DA</th>
                <th>Article</th>
                <th>Designation</th>
                <th>Quantite</th>
                <th>RFQ</th>
                <th>Fournisseur</th>
                <th>Reponses</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (l of lignes(); track l.id) {
                <tr [class.desactive]="!l.actif">
                  <td class="code">{{ l.numero_da }}</td>
                  <td class="code">{{ l.code_article }}</td>
                  <td class="designation">{{ l.designation_article || '-' }}</td>
                  <td>{{ l.quantite_demandee }} {{ l.unite || '' }}</td>
                  <td class="code">{{ l.numero_rfq }}</td>
                  <td>{{ l.nom_fournisseur || l.code_fournisseur || '-' }}</td>
                  <td>
                    <span class="badge" [class.badge-info]="l.nb_reponses > 0">
                      {{ l.nb_reponses }}
                    </span>
                  </td>
                  <td>
                    @if (l.actif) {
                      <span class="badge badge-success">Active</span>
                    } @else {
                      <span class="badge badge-danger" [title]="l.motif_desactivation || ''">
                        Desactivee
                      </span>
                    }
                  </td>
                  <td>
                    @if (l.actif) {
                      <button
                        class="btn-icon danger"
                        (click)="openDesactiverModal(l)"
                        title="Desactiver"
                      >
                        X
                      </button>
                    } @else {
                      <button
                        class="btn-icon success"
                        (click)="reactiver(l)"
                        title="Reactiver"
                      >
                        +
                      </button>
                    }
                    <button
                      class="btn-icon info"
                      (click)="openDetailModal(l)"
                      title="Details"
                    >
                      i
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="pagination">
            <span class="pagination-info">
              {{ (filters.page! - 1) * filters.limit! + 1 }} -
              {{ Math.min(filters.page! * filters.limit!, total()) }} sur {{ total() }}
            </span>
            <div class="pagination-buttons">
              <button
                [disabled]="filters.page === 1"
                (click)="goToPage(filters.page! - 1)"
              >
                Precedent
              </button>
              <button
                [disabled]="filters.page! * filters.limit! >= total()"
                (click)="goToPage(filters.page! + 1)"
              >
                Suivant
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Modal Désactivation -->
      @if (showDesactiverModal && selectedLigne) {
        <div class="modal-overlay" (click)="showDesactiverModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Desactiver la ligne</h3>
              <button class="close-btn" (click)="showDesactiverModal = false">X</button>
            </div>
            <div class="modal-body">
              <div class="ligne-info">
                <p><strong>DA:</strong> {{ selectedLigne.numero_da }}</p>
                <p><strong>Article:</strong> {{ selectedLigne.code_article }}</p>
                <p><strong>Designation:</strong> {{ selectedLigne.designation_article || '-' }}</p>
                <p><strong>Reponses fournisseurs:</strong> {{ selectedLigne.nb_reponses }}</p>
              </div>

              @if (selectedLigne.nb_reponses > 0) {
                <div class="alert alert-warning">
                  Attention: Cette ligne a {{ selectedLigne.nb_reponses }} reponse(s) fournisseur(s).
                  En la desactivant, ces reponses ne seront plus visibles dans les comparaisons.
                </div>
              }

              <div class="form-group">
                <label>Motif de desactivation *</label>
                <textarea
                  [(ngModel)]="motifDesactivation"
                  placeholder="Indiquez la raison de la desactivation..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showDesactiverModal = false">Annuler</button>
              <button
                class="btn btn-danger"
                [disabled]="!motifDesactivation.trim() || actionLoading"
                (click)="confirmDesactiver()"
              >
                {{ actionLoading ? 'En cours...' : 'Desactiver' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Détail -->
      @if (showDetailModal && selectedLigne) {
        <div class="modal-overlay" (click)="showDetailModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Detail de la ligne</h3>
              <button class="close-btn" (click)="showDetailModal = false">X</button>
            </div>
            <div class="modal-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <label>ID</label>
                  <span>{{ selectedLigne.id }}</span>
                </div>
                <div class="detail-item">
                  <label>Numero DA</label>
                  <span>{{ selectedLigne.numero_da }}</span>
                </div>
                <div class="detail-item">
                  <label>Code Article</label>
                  <span>{{ selectedLigne.code_article }}</span>
                </div>
                <div class="detail-item">
                  <label>Designation</label>
                  <span>{{ selectedLigne.designation_article || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>Quantite</label>
                  <span>{{ selectedLigne.quantite_demandee }} {{ selectedLigne.unite || '' }}</span>
                </div>
                <div class="detail-item">
                  <label>Marque souhaitee</label>
                  <span>{{ selectedLigne.marque_souhaitee || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>Numero RFQ</label>
                  <span>{{ selectedLigne.numero_rfq }}</span>
                </div>
                <div class="detail-item">
                  <label>Fournisseur</label>
                  <span>{{ selectedLigne.nom_fournisseur || selectedLigne.code_fournisseur || '-' }}</span>
                </div>
                <div class="detail-item">
                  <label>Reponses recues</label>
                  <span>{{ selectedLigne.nb_reponses }}</span>
                </div>
                <div class="detail-item">
                  <label>Statut</label>
                  <span [class]="selectedLigne.actif ? 'status-active' : 'status-inactive'">
                    {{ selectedLigne.actif ? 'Active' : 'Desactivee' }}
                  </span>
                </div>
                @if (!selectedLigne.actif) {
                  <div class="detail-item full-width">
                    <label>Motif desactivation</label>
                    <span>{{ selectedLigne.motif_desactivation || '-' }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Desactivee le</label>
                    <span>{{ formatDate(selectedLigne.date_desactivation) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Desactivee par</label>
                    <span>{{ selectedLigne.desactive_par || '-' }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showDetailModal = false">Fermer</button>
            </div>
          </div>
        </div>
      }
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
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    .admin-badge {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 600px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-card.success {
      border-left: 4px solid #22c55e;
    }

    .stat-card.danger {
      border-left: 4px solid #ef4444;
    }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
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
      min-width: 180px;
    }

    .filter-group input:focus,
    .filter-group select:focus {
      outline: none;
      border-color: #7c3aed;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: white;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

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
      padding: 12px 16px;
      text-align: left;
    }

    .data-table th {
      background: #f9fafb;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
      font-size: 13px;
      color: #374151;
    }

    .data-table tr:hover td {
      background: #f9fafb;
    }

    .data-table tr.desactive td {
      background: #fef2f2;
      color: #9ca3af;
    }

    .code {
      font-family: monospace;
      font-weight: 500;
    }

    .designation {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-info { background: #dbeafe; color: #2563eb; }
    .badge-warning { background: #fef3c7; color: #d97706; }

    .btn-icon {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: #f3f4f6;
      color: #374151;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      margin-right: 4px;
    }

    .btn-icon.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-icon.success {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-icon.info {
      background: #dbeafe;
      color: #2563eb;
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

    .pagination-buttons button:hover:not(:disabled) {
      background: #f9fafb;
    }

    .pagination-buttons button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading & Empty */
    .loading, .empty {
      padding: 60px;
      text-align: center;
      color: #9ca3af;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .ligne-info {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .ligne-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .alert-warning {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 14px;
    }

    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: #7c3aed;
    }

    /* Detail Grid */
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .detail-item.full-width {
      grid-column: span 2;
    }

    .detail-item label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .detail-item span {
      font-size: 14px;
      color: #1f2937;
    }

    .status-active {
      color: #16a34a;
      font-weight: 600;
    }

    .status-inactive {
      color: #dc2626;
      font-weight: 600;
    }
  `]
})
export class AdminCotationsComponent implements OnInit {
  lignes = signal<LigneCotationAdmin[]>([]);
  stats = signal<StatsLignesCotation | null>(null);
  dasList = signal<string[]>([]);
  total = signal(0);
  loading = signal(false);

  filters: AdminCotationFilters = {
    page: 1,
    limit: 50,
    numero_da: '',
    code_article: '',
    actif: undefined,
    search: ''
  };

  showDesactiverModal = false;
  showDetailModal = false;
  selectedLigne: LigneCotationAdmin | null = null;
  motifDesactivation = '';
  actionLoading = false;

  private searchTimeout: any;

  Math = Math;

  constructor(private adminCotationService: AdminCotationService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadDAsList();
    this.loadLignes();
  }

  loadStats(): void {
    this.adminCotationService.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  loadDAsList(): void {
    this.adminCotationService.getDAsList().subscribe({
      next: (data) => this.dasList.set(data.das),
      error: (err) => console.error('Error loading DAs:', err)
    });
  }

  loadLignes(): void {
    this.loading.set(true);

    const params: AdminCotationFilters = {
      page: this.filters.page,
      limit: this.filters.limit
    };

    if (this.filters.numero_da) params.numero_da = this.filters.numero_da;
    if (this.filters.code_article) params.code_article = this.filters.code_article;
    if (this.filters.actif !== undefined) params.actif = this.filters.actif;
    if (this.filters.search) params.search = this.filters.search;

    this.adminCotationService.getAll(params).subscribe({
      next: (response) => {
        this.lignes.set(response.lignes);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading lignes:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadLignes();
    }, 300);
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 50,
      numero_da: '',
      code_article: '',
      actif: undefined,
      search: ''
    };
    this.loadLignes();
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadLignes();
  }

  openDesactiverModal(ligne: LigneCotationAdmin): void {
    this.selectedLigne = ligne;
    this.motifDesactivation = '';
    this.showDesactiverModal = true;
  }

  confirmDesactiver(): void {
    if (!this.selectedLigne || !this.motifDesactivation.trim()) return;

    this.actionLoading = true;

    this.adminCotationService.desactiver(this.selectedLigne.id, {
      motif: this.motifDesactivation
    }).subscribe({
      next: () => {
        this.showDesactiverModal = false;
        this.actionLoading = false;
        this.loadStats();
        this.loadLignes();
      },
      error: (err) => {
        console.error('Error desactivating:', err);
        this.actionLoading = false;
      }
    });
  }

  reactiver(ligne: LigneCotationAdmin): void {
    if (!confirm(`Reactiver l'article ${ligne.code_article} de la DA ${ligne.numero_da} ?`)) return;

    this.adminCotationService.reactiver(ligne.id).subscribe({
      next: () => {
        this.loadStats();
        this.loadLignes();
      },
      error: (err) => console.error('Error reactivating:', err)
    });
  }

  openDetailModal(ligne: LigneCotationAdmin): void {
    this.selectedLigne = ligne;
    this.showDetailModal = true;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
