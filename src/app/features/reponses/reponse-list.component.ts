import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReponseService } from '../../core/services/reponse.service';
import { ReponseComplete, ReponseAcheteurComplete } from '../../core/models';

@Component({
  selector: 'app-reponse-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Offres Fournisseurs</h1>
        <!-- <a routerLink="/reponses/saisie-manuelle" class="btn btn-primary">
          + Saisie Manuelle
        </a> -->
      </div>

      <!-- Onglets -->
      <div class="tabs">
        <button
          class="tab"
          [class.active]="activeTab() === 'fournisseurs'"
          (click)="switchTab('fournisseurs')"
        >
          Offres Fournisseurs
          @if (total() > 0 && activeTab() === 'fournisseurs') {
            <span class="badge">{{ total() }}</span>
          }
        </button>
        <button
          class="tab"
          [class.active]="activeTab() === 'acheteur'"
          (click)="switchTab('acheteur')"
        >
          Saisies Manuelles
          @if (totalAcheteur() > 0 && activeTab() === 'acheteur') {
            <span class="badge">{{ totalAcheteur() }}</span>
          }
        </button>
      </div>

      <!-- Filtres (seulement pour fournisseurs) -->
      @if (activeTab() === 'fournisseurs') {
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
      }

      <!-- Liste des reponses fournisseurs -->
      @if (activeTab() === 'fournisseurs') {
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
                      <span class="rfq-number">{{ r.numero_rfq }}</span>
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
      }

      <!-- Liste des reponses acheteur (saisies manuelles) -->
      @if (activeTab() === 'acheteur') {
        <div class="table-card">
          @if (loadingAcheteur()) {
            <div class="loading">Chargement...</div>
          } @else if (reponsesAcheteur().length === 0) {
            <div class="empty">
              <p>Aucune saisie manuelle</p>
              <!-- <a routerLink="/reponses/saisie-manuelle" class="btn btn-primary" style="margin-top: 16px;">
                + Nouvelle saisie
              </a> -->
            </div>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>N RFQ</th>
                  <th>N DA</th>
                  <th>Date saisie</th>
                  <th>Saisi par</th>
                  <th>Articles</th>
                  <th>Fournisseurs</th>
                  <th>Devise</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (r of reponsesAcheteur(); track r.id) {
                  <tr>
                    <td>
                      <span class="rfq-number rfq-acheteur">{{ r.numero_rfq }}</span>
                    </td>
                    <td>{{ r.numero_da }}</td>
                    <td>{{ r.date_soumission | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ r.saisi_par_email || '-' }}</td>
                    <td>{{ r.lignes.length }}</td>
                    <td>
                      <div class="fournisseurs-list">
                        @for (f of getUniqueFournisseurs(r); track f) {
                          <span class="fournisseur-tag">{{ f }}</span>
                        }
                      </div>
                    </td>
                    <td>{{ r.devise }}</td>
                    <td>
                      <div class="actions">
                        <a [routerLink]="['/reponses/acheteur', r.id]" class="btn-icon" title="Voir details">
                          V
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Pagination Acheteur -->
            <div class="pagination">
              <span class="pagination-info">
                {{ (pageAcheteur - 1) * limit + 1 }} - {{ Math.min(pageAcheteur * limit, totalAcheteur()) }} sur {{ totalAcheteur() }}
              </span>
              <div class="pagination-buttons">
                <button [disabled]="pageAcheteur === 1" (click)="goToPageAcheteur(pageAcheteur - 1)">Precedent</button>
                <button [disabled]="pageAcheteur * limit >= totalAcheteur()" (click)="goToPageAcheteur(pageAcheteur + 1)">Suivant</button>
              </div>
            </div>
          }
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
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      background: white;
      padding: 4px;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .tab {
      flex: 1;
      padding: 12px 20px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .tab:hover {
      background: #f1f5f9;
    }

    .tab.active {
      background: #3b82f6;
      color: white;
    }

    .badge {
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .tab:not(.active) .badge {
      background: #e2e8f0;
      color: #64748b;
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
      text-decoration: none;
      display: inline-block;
      font-weight: 500;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
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

    .rfq-number {
      color: #2d5a87;
      font-weight: 500;
    }

    .rfq-acheteur {
      color: #059669;
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

    .fournisseurs-list {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .fournisseur-tag {
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      white-space: nowrap;
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

    .empty p {
      margin: 0 0 8px 0;
    }
  `]
})
export class ReponseListComponent implements OnInit {
  // Onglet actif
  activeTab = signal<'fournisseurs' | 'acheteur'>('fournisseurs');

  // Reponses fournisseurs
  reponses = signal<ReponseComplete[]>([]);
  total = signal(0);
  loading = signal(false);
  dateDebut = '';
  dateFin = '';
  page = 1;
  limit = 20;

  // Reponses acheteur
  reponsesAcheteur = signal<ReponseAcheteurComplete[]>([]);
  totalAcheteur = signal(0);
  loadingAcheteur = signal(false);
  pageAcheteur = 1;

  Math = Math;

  constructor(private reponseService: ReponseService) {}

  ngOnInit(): void {
    this.loadReponses();
    this.loadReponsesAcheteur();
  }

  switchTab(tab: 'fournisseurs' | 'acheteur'): void {
    this.activeTab.set(tab);
  }

  // --- Reponses Fournisseurs ---

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
      error: () => this.loading.set(false)
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

  // --- Reponses Acheteur ---

  loadReponsesAcheteur(): void {
    this.loadingAcheteur.set(true);
    this.reponseService.listReponsesAcheteur(this.pageAcheteur, this.limit).subscribe({
      next: (response) => {
        this.reponsesAcheteur.set(response.reponses);
        this.totalAcheteur.set(response.total);
        this.loadingAcheteur.set(false);
      },
      error: () => this.loadingAcheteur.set(false)
    });
  }

  goToPageAcheteur(p: number): void {
    this.pageAcheteur = p;
    this.loadReponsesAcheteur();
  }

  getUniqueFournisseurs(r: ReponseAcheteurComplete): string[] {
    const fournisseurs = new Set<string>();
    r.lignes.forEach(l => fournisseurs.add(l.nom_fournisseur));
    return Array.from(fournisseurs).slice(0, 3);
  }
}
