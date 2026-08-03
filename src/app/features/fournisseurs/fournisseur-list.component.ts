import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FournisseurService, FournisseurFilters } from '../../core/services/fournisseur.service';
import { Fournisseur, FournisseurCreate, FournisseurUpdate, StatutFournisseur } from '../../core/models';

@Component({
  selector: 'app-fournisseur-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Fournisseurs</h1>
        <button class="btn btn-primary" (click)="openAddModal()">
          + Nouveau Fournisseur
        </button>
      </div>

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters">
          <div class="filter-group">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="Code, nom ou email..."
              [(ngModel)]="filters.search"
              (input)="onSearch()"
            />
          </div>

          <div class="filter-group">
            <label>Statut</label>
            <select [(ngModel)]="filters.statut" (change)="loadFournisseurs()">
              <option [ngValue]="undefined">Tous</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </div>

          <div class="filter-group">
            <label>Blacklist</label>
            <select [(ngModel)]="filters.blacklist" (change)="loadFournisseurs()">
              <option [ngValue]="undefined">Tous</option>
              <option [ngValue]="false">Non blacklistes</option>
              <option [ngValue]="true">Blacklistes</option>
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
        } @else if (fournisseurs().length === 0) {
          <div class="empty">Aucun fournisseur trouve</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Email</th>
                <th>Telephone</th>
                <th>Statut</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (f of fournisseurs(); track f.id) {
                <tr [class.blacklisted]="f.blacklist">
                  <td>
                    <a [routerLink]="['/fournisseurs', f.code_fournisseur]" class="code-link">
                      {{ f.code_fournisseur }}
                    </a>
                  </td>
                  <td>
                    <div class="name-cell">
                      {{ f.nom_fournisseur }}
                      @if (f.blacklist) {
                        <span class="badge badge-danger">BL</span>
                      }
                    </div>
                  </td>
                  <td>{{ f.email || '-' }}</td>
                  <td>{{ f.telephone || '-' }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + f.statut">
                      {{ f.statut }}
                    </span>
                  </td>
                  <td>
                    <div class="perf-cell">
                      <span class="taux">{{ f.taux_reponse || 0 }}%</span>
                      <span class="note">{{ f.note_performance || '-' }}/5</span>
                    </div>
                  </td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="['/fournisseurs', f.code_fournisseur]" class="btn-icon" title="Voir">
                        V
                      </a>
                      <button class="btn-icon edit" (click)="openEditModal(f)" title="Modifier">
                        E
                      </button>
                      @if (!f.blacklist) {
                        <button class="btn-icon danger" (click)="openBlacklistModal(f)" title="Blacklister">
                          X
                        </button>
                      } @else {
                        <button class="btn-icon success" (click)="unblacklist(f)" title="Retirer">
                          +
                        </button>
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

      <!-- Modal Blacklist -->
      @if (showBlacklistModal && selectedFournisseur) {
        <div class="modal-overlay" (click)="showBlacklistModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Blacklister le fournisseur</h3>
              <button class="close-btn" (click)="showBlacklistModal = false">X</button>
            </div>
            <div class="modal-body">
              <p>Etes-vous sur de vouloir blacklister <strong>{{ selectedFournisseur.nom_fournisseur }}</strong> ?</p>
              <div class="form-group">
                <label>Motif du blacklistage *</label>
                <textarea
                  [(ngModel)]="blacklistMotif"
                  placeholder="Entrez le motif..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showBlacklistModal = false">Annuler</button>
              <button
                class="btn btn-danger"
                [disabled]="!blacklistMotif.trim()"
                (click)="confirmBlacklist()"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Ajout/Modification Fournisseur -->
      @if (showFormModal) {
        <div class="modal-overlay" (click)="closeFormModal()">
          <div class="modal modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode ? 'Modifier le fournisseur' : 'Nouveau fournisseur' }}</h3>
              <button class="close-btn" (click)="closeFormModal()">X</button>
            </div>
            <div class="modal-body">
              @if (formError) {
                <div class="alert alert-error">{{ formError }}</div>
              }
              <div class="form-grid">
                <div class="form-group">
                  <label>Code fournisseur *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.code_fournisseur"
                    [disabled]="isEditMode"
                    placeholder="Ex: FRN001"
                  />
                </div>
                <div class="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.nom_fournisseur"
                    placeholder="Nom du fournisseur"
                  />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    [(ngModel)]="formData.email"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div class="form-group">
                  <label>Telephone</label>
                  <input
                    type="tel"
                    [(ngModel)]="formData.telephone"
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>
                <div class="form-group">
                  <label>Fax</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.fax"
                    placeholder="Numero de fax"
                  />
                </div>
                <div class="form-group">
                  <label>Adresse</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.adresse"
                    placeholder="Adresse complete"
                  />
                </div>
                <div class="form-group">
                  <label>Ville</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.ville"
                    placeholder="Ville"
                  />
                </div>
                <div class="form-group">
                  <label>Pays</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.pays"
                    placeholder="Pays"
                  />
                </div>
                @if (isEditMode) {
                  <div class="form-group">
                    <label>Statut</label>
                    <select [(ngModel)]="formData.statut">
                      <option value="actif">Actif</option>
                      <option value="inactif">Inactif</option>
                      <option value="suspendu">Suspendu</option>
                    </select>
                  </div>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeFormModal()">Annuler</button>
              <button
                class="btn btn-primary"
                [disabled]="!isFormValid() || formLoading"
                (click)="submitForm()"
              >
                {{ formLoading ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Creer') }}
              </button>
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
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
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
      background: linear-gradient(135deg, #2d5a87, #1e3a5f);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(45, 90, 135, 0.3);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
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
      border-color: #2d5a87;
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
      padding: 14px 16px;
      text-align: left;
    }

    .data-table th {
      background: #f9fafb;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }

    .data-table tr:hover td {
      background: #f9fafb;
    }

    .data-table tr.blacklisted td {
      background: #fef2f2;
    }

    .code-link {
      color: #2d5a87;
      font-weight: 500;
      text-decoration: none;
    }

    .code-link:hover {
      text-decoration: underline;
    }

    .name-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-actif { background: #dcfce7; color: #16a34a; }
    .badge-inactif { background: #f3f4f6; color: #6b7280; }
    .badge-suspendu { background: #fef3c7; color: #d97706; }
    .badge-danger { background: #fee2e2; color: #dc2626; }

    .perf-cell {
      display: flex;
      flex-direction: column;
    }

    .perf-cell .taux {
      font-weight: 600;
      color: #22c55e;
    }

    .perf-cell .note {
      font-size: 12px;
      color: #9ca3af;
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

    .btn-icon.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-icon.success {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-icon.edit {
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
      max-width: 450px;
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

    .modal-body p {
      margin: 0 0 16px;
      color: #374151;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .modal-large {
      max-width: 600px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #2d5a87;
    }

    .form-group input:disabled {
      background: #f3f4f6;
      color: #6b7280;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .alert-error {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .alert-success {
      background: #dcfce7;
      color: #16a34a;
      border: 1px solid #bbf7d0;
    }
  `]
})
export class FournisseurListComponent implements OnInit {
  fournisseurs = signal<Fournisseur[]>([]);
  total = signal(0);
  loading = signal(false);

  filters: FournisseurFilters = {
    page: 1,
    limit: 20,
    statut: undefined,
    blacklist: undefined,
    search: ''
  };

  showBlacklistModal = false;
  showFormModal = false;
  isEditMode = false;
  selectedFournisseur: Fournisseur | null = null;
  blacklistMotif = '';
  formLoading = false;
  formError = '';

  formData: {
    code_fournisseur: string;
    nom_fournisseur: string;
    email: string;
    telephone: string;
    fax: string;
    adresse: string;
    ville: string;
    pays: string;
    statut: StatutFournisseur;
  } = this.getEmptyFormData();

  private searchTimeout: any;

  Math = Math;

  constructor(private fournisseurService: FournisseurService) {}

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  loadFournisseurs(): void {
    this.loading.set(true);
    this.fournisseurService.getAll(this.filters).subscribe({
      next: (response) => {
        this.fournisseurs.set(response.fournisseurs);
        this.total.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading fournisseurs:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters.page = 1;
      this.loadFournisseurs();
    }, 300);
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 20,
      statut: undefined,
      blacklist: undefined,
      search: ''
    };
    this.loadFournisseurs();
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadFournisseurs();
  }

  openBlacklistModal(f: Fournisseur): void {
    this.selectedFournisseur = f;
    this.blacklistMotif = '';
    this.showBlacklistModal = true;
  }

  confirmBlacklist(): void {
    if (!this.selectedFournisseur || !this.blacklistMotif.trim()) return;

    this.fournisseurService.blacklist(
      this.selectedFournisseur.code_fournisseur,
      { motif: this.blacklistMotif }
    ).subscribe({
      next: () => {
        this.showBlacklistModal = false;
        this.loadFournisseurs();
      },
      error: (err) => console.error('Error blacklisting:', err)
    });
  }

  unblacklist(f: Fournisseur): void {
    if (!confirm(`Retirer ${f.nom_fournisseur} de la blacklist ?`)) return;

    this.fournisseurService.unblacklist(f.code_fournisseur).subscribe({
      next: () => this.loadFournisseurs(),
      error: (err) => console.error('Error unblacklisting:', err)
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Modal Ajout/Modification
  // ═══════════════════════════════════════════════════════════

  getEmptyFormData() {
    return {
      code_fournisseur: '',
      nom_fournisseur: '',
      email: '',
      telephone: '',
      fax: '',
      adresse: '',
      ville: '',
      pays: '',
      statut: 'actif' as StatutFournisseur
    };
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.formData = this.getEmptyFormData();
    this.formError = '';
    this.showFormModal = true;
  }

  openEditModal(f: Fournisseur): void {
    this.isEditMode = true;
    this.selectedFournisseur = f;
    this.formData = {
      code_fournisseur: f.code_fournisseur,
      nom_fournisseur: f.nom_fournisseur,
      email: f.email || '',
      telephone: f.telephone || '',
      fax: f.fax || '',
      adresse: f.adresse || '',
      ville: f.ville || '',
      pays: f.pays || '',
      statut: f.statut
    };
    this.formError = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.selectedFournisseur = null;
    this.formError = '';
  }

  isFormValid(): boolean {
    return !!(this.formData.code_fournisseur.trim() && this.formData.nom_fournisseur.trim());
  }

  submitForm(): void {
    if (!this.isFormValid()) return;

    this.formLoading = true;
    this.formError = '';

    if (this.isEditMode) {
      this.updateFournisseur();
    } else {
      this.createFournisseur();
    }
  }

  private createFournisseur(): void {
    const data: FournisseurCreate = {
      code_fournisseur: this.formData.code_fournisseur.trim(),
      nom_fournisseur: this.formData.nom_fournisseur.trim()
    };

    // Ajouter les champs optionnels
    if (this.formData.email.trim()) data.email = this.formData.email.trim();
    if (this.formData.telephone.trim()) data.telephone = this.formData.telephone.trim();
    if (this.formData.fax.trim()) data.fax = this.formData.fax.trim();
    if (this.formData.adresse.trim()) data.adresse = this.formData.adresse.trim();
    if (this.formData.ville.trim()) data.ville = this.formData.ville.trim();
    if (this.formData.pays.trim()) data.pays = this.formData.pays.trim();

    this.fournisseurService.create(data).subscribe({
      next: () => {
        this.formLoading = false;
        this.closeFormModal();
        this.loadFournisseurs();
      },
      error: (err) => {
        console.error('Error creating fournisseur:', err);
        this.formError = err.error?.detail || 'Erreur lors de la creation du fournisseur';
        this.formLoading = false;
      }
    });
  }

  private updateFournisseur(): void {
    if (!this.selectedFournisseur) return;

    const data: FournisseurUpdate = {};

    // Ajouter uniquement les champs modifies
    if (this.formData.nom_fournisseur.trim()) data.nom_fournisseur = this.formData.nom_fournisseur.trim();
    if (this.formData.email.trim()) data.email = this.formData.email.trim();
    if (this.formData.telephone.trim()) data.telephone = this.formData.telephone.trim();
    if (this.formData.fax.trim()) data.fax = this.formData.fax.trim();
    if (this.formData.adresse.trim()) data.adresse = this.formData.adresse.trim();
    if (this.formData.ville.trim()) data.ville = this.formData.ville.trim();
    if (this.formData.pays.trim()) data.pays = this.formData.pays.trim();
    if (this.formData.statut) data.statut = this.formData.statut;

    this.fournisseurService.update(this.selectedFournisseur.code_fournisseur, data).subscribe({
      next: () => {
        this.formLoading = false;
        this.closeFormModal();
        this.loadFournisseurs();
      },
      error: (err) => {
        console.error('Error updating fournisseur:', err);
        this.formError = err.error?.detail || 'Erreur lors de la modification du fournisseur';
        this.formLoading = false;
      }
    });
  }
}
