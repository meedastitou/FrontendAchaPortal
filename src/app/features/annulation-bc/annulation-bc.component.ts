import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnulationBCService } from '../../core/services/annulation-bc.service';
import {
  AnnulationBC,
  AnnulationBCCreate,
  AnnulationBCListResponse,
  StatutAnnulation
} from '../../core/models';

@Component({
  selector: 'app-annulation-bc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="annulation-container">
      <!-- Header -->
      <div class="page-header">
        <h1>Demande d'Annulation de Commande</h1>
        <p class="subtitle">Soumettre une demande d'annulation de bon de commande</p>
      </div>

      <!-- Formulaire de demande -->
      <div class="form-card">
        <h2>Nouvelle demande</h2>

        <form (ngSubmit)="submitDemande()" #demandeForm="ngForm">
          <div class="form-group">
            <label for="numero_commande">Numero de Commande *</label>
            <input
              type="text"
              id="numero_commande"
              name="numero_commande"
              [(ngModel)]="formData.numero_commande"
              required
              placeholder="Ex: BC-2026-0001"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label for="motif_annulation">Motif d'annulation *</label>
            <textarea
              id="motif_annulation"
              name="motif_annulation"
              [(ngModel)]="formData.motif_annulation"
              required
              placeholder="Expliquez la raison de l'annulation..."
              class="form-control"
              rows="4"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="!demandeForm.valid || isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="spinner"></span> Envoi en cours...
              } @else {
                Soumettre la demande
              }
            </button>
          </div>
        </form>

        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
          </div>
        }

        @if (errorMessage()) {
          <div class="alert alert-error">
            {{ errorMessage() }}
          </div>
        }
      </div>

      <!-- Liste des demandes -->
      <div class="list-card">
        <div class="list-header">
          <h2>Historique des demandes</h2>
          <button class="btn btn-secondary" (click)="loadDemandes()">
            Actualiser
          </button>
        </div>

        @if (isLoading()) {
          <div class="loading-state">
            <span class="spinner"></span> Chargement...
          </div>
        } @else if (demandes().length === 0) {
          <div class="empty-state">
            <p>Aucune demande d'annulation trouvee</p>
          </div>
        } @else {
          <div class="table-container">
            <div class="table-scroll"><table class="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>N Commande</th>
                  <th>Motif</th>
                  <th>Demande par</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                @for (demande of demandes(); track demande.id) {
                  <tr>
                    <td>{{ demande.id }}</td>
                    <td class="numero-cell">{{ demande.numero_commande }}</td>
                    <td class="motif-cell">{{ demande.motif_annulation }}</td>
                    <td>{{ demande.demande_par }}</td>
                    <td>
                      <span [class]="'badge badge-' + demande.statut">
                        {{ getStatutLabel(demande.statut) }}
                      </span>
                    </td>
                    <td>{{ formatDate(demande.created_at) }}</td>
                  </tr>
                }
              </tbody>
            </table></div>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="pagination">
              <button
                class="btn btn-sm"
                [disabled]="currentPage() === 1"
                (click)="goToPage(currentPage() - 1)"
              >
                Precedent
              </button>
              <span class="page-info">
                Page {{ currentPage() }} / {{ totalPages() }}
              </span>
              <button
                class="btn btn-sm"
                [disabled]="currentPage() === totalPages()"
                (click)="goToPage(currentPage() + 1)"
              >
                Suivant
              </button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .annulation-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
    }

    .subtitle {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }

    .form-card, .list-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .form-card h2, .list-card h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea.form-control {
      resize: vertical;
      min-height: 100px;
    }

    .form-actions {
      margin-top: 24px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 14px;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .list-header h2 {
      margin: 0;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px;
      color: #6b7280;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .data-table th {
      background: #f9fafb;
      font-weight: 600;
      font-size: 13px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .data-table td {
      font-size: 14px;
      color: #374151;
    }

    .data-table tr:hover {
      background: #f9fafb;
    }

    .numero-cell {
      font-family: monospace;
      font-weight: 600;
      color: #1e3a5f;
    }

    .motif-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-en_attente {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-en_cours {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-validee {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-refusee {
      background: #fee2e2;
      color: #991b1b;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .page-info {
      font-size: 14px;
      color: #6b7280;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff40;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-state .spinner {
      border-color: #3b82f640;
      border-top-color: #3b82f6;
      width: 24px;
      height: 24px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AnnulationBCComponent implements OnInit {
  formData: AnnulationBCCreate = {
    numero_commande: '',
    motif_annulation: ''
  };

  isSubmitting = signal(false);
  isLoading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  demandes = signal<AnnulationBC[]>([]);
  totalDemandes = signal(0);
  currentPage = signal(1);
  limit = 10;

  constructor(private annulationService: AnnulationBCService) {}

  ngOnInit(): void {
    this.loadDemandes();
  }

  get totalPages(): () => number {
    return () => Math.ceil(this.totalDemandes() / this.limit);
  }

  loadDemandes(): void {
    this.isLoading.set(true);
    this.annulationService.getAll({
      page: this.currentPage(),
      limit: this.limit
    }).subscribe({
      next: (response: AnnulationBCListResponse) => {
        this.demandes.set(response.annulations);
        this.totalDemandes.set(response.total);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des demandes:', error);
        this.isLoading.set(false);
      }
    });
  }

  submitDemande(): void {
    if (!this.formData.numero_commande.trim() || !this.formData.motif_annulation.trim()) {
      this.errorMessage.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSubmitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.annulationService.create(this.formData).subscribe({
      next: (response) => {
        this.successMessage.set(response.message);
        this.formData = { numero_commande: '', motif_annulation: '' };
        this.isSubmitting.set(false);
        this.loadDemandes();
      },
      error: (error) => {
        this.errorMessage.set(
          error.error?.detail || 'Une erreur est survenue lors de la soumission'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadDemandes();
    }
  }

  getStatutLabel(statut: StatutAnnulation): string {
    const labels: Record<StatutAnnulation, string> = {
      'en_attente': 'En attente',
      'en_cours': 'En cours',
      'validee': 'Validee',
      'refusee': 'Refusee'
    };
    return labels[statut] || statut;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
