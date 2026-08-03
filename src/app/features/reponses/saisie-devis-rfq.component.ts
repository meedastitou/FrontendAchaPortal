import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReponseService } from '../../core/services/reponse.service';
import { FournisseurService } from '../../core/services/fournisseur.service';
import {
  RFQPourSaisie,
  RFQDetailPourSaisie,
  LigneCotationPourSaisie,
  LigneDevisRFQ,
  SaisieDevisRFQRequest,
  Fournisseur
} from '../../core/models';

interface LigneDevisForm extends LigneCotationPourSaisie {
  prix_unitaire_ht?: number;
  quantite_disponible?: number;
  delai_livraison_jours?: number;
  marque_proposee?: string;
  commentaire_article?: string;
}

@Component({
  selector: 'app-saisie-devis-rfq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/reponses" class="back-link">< Retour</a>
          <h1>Saisie Devis par RFQ</h1>
        </div>
      </div>

      <!-- Stepper -->
      <div class="stepper">
        <div class="step" [class.active]="step() === 1" [class.completed]="step() > 1">
          <span class="step-number">1</span>
          <span class="step-label">Selection RFQ</span>
        </div>
        <div class="step-connector" [class.active]="step() > 1"></div>
        <div class="step" [class.active]="step() === 2" [class.completed]="step() > 2">
          <span class="step-number">2</span>
          <span class="step-label">Saisie des articles</span>
        </div>
        <div class="step-connector" [class.active]="step() > 2"></div>
        <div class="step" [class.active]="step() === 3">
          <span class="step-number">3</span>
          <span class="step-label">Confirmation</span>
        </div>
      </div>

      <!-- Step 1: Selection RFQ -->
      @if (step() === 1) {
        <div class="step-content">
          <div class="selection-card">
            <h2>Selectionner un RFQ</h2>

            <div class="filters">
              <div class="filter-group">
                <label>Fournisseur (optionnel)</label>
                <select [(ngModel)]="selectedFournisseur" (change)="onFournisseurChange()">
                  <option value="">Tous les fournisseurs</option>
                  @for (f of fournisseurs(); track f.code_fournisseur) {
                    <option [value]="f.code_fournisseur">{{ f.nom_fournisseur }}</option>
                  }
                </select>
              </div>

              <div class="filter-group">
                <label>Recherche RFQ</label>
                <input
                  type="text"
                  [(ngModel)]="searchRFQ"
                  (input)="onSearchChange()"
                  placeholder="Numero RFQ ou fournisseur..."
                />
              </div>
            </div>

            @if (loadingRFQs()) {
              <div class="loading">Chargement des RFQs...</div>
            } @else if (rfqs().length === 0) {
              <div class="empty">Aucun RFQ en attente de reponse</div>
            } @else {
              <div class="rfq-list">
                @for (rfq of rfqs(); track rfq.uuid) {
                  <div
                    class="rfq-item"
                    [class.selected]="selectedRFQ()?.uuid === rfq.uuid"
                    (click)="selectRFQ(rfq)"
                  >
                    <div class="rfq-main">
                      <span class="rfq-number">{{ rfq.numero_rfq }}</span>
                      <span class="rfq-statut" [class]="'statut-' + rfq.statut">{{ getStatutLabel(rfq.statut) }}</span>
                    </div>
                    <div class="rfq-details">
                      <span class="fournisseur">{{ rfq.nom_fournisseur }}</span>
                      <span class="separator">|</span>
                      <span class="articles">{{ rfq.nb_articles }} article(s)</span>
                      <span class="separator">|</span>
                      <span class="date">{{ rfq.date_envoi | date:'dd/MM/yyyy' }}</span>
                    </div>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (totalRFQs() > limit) {
                <div class="pagination">
                  <span class="pagination-info">
                    {{ (page - 1) * limit + 1 }} - {{ Math.min(page * limit, totalRFQs()) }} sur {{ totalRFQs() }}
                  </span>
                  <div class="pagination-buttons">
                    <button [disabled]="page === 1" (click)="goToPage(page - 1)">Precedent</button>
                    <button [disabled]="page * limit >= totalRFQs()" (click)="goToPage(page + 1)">Suivant</button>
                  </div>
                </div>
              }
            }
          </div>

          <div class="step-actions">
            <button class="btn btn-primary" [disabled]="!selectedRFQ()" (click)="goToStep2()">
              Continuer
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Saisie des articles -->
      @if (step() === 2) {
        <div class="step-content">
          <div class="rfq-header-card">
            <div class="rfq-info">
              <h3>{{ rfqDetail()?.numero_rfq }}</h3>
              <p>{{ rfqDetail()?.nom_fournisseur }} ({{ rfqDetail()?.code_fournisseur }})</p>
            </div>
          </div>

          <!-- Informations globales -->
          <div class="global-info-card">
            <h4>Informations du devis</h4>
            <div class="global-fields">
              <div class="field-group">
                <label>Reference devis fournisseur</label>
                <input type="text" [(ngModel)]="referenceFournisseur" placeholder="Ref. devis..." />
              </div>
              <div class="field-group">
                <label>Devise</label>
                <select [(ngModel)]="devise">
                  <option value="MAD">MAD</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div class="field-group">
                <label>Conditions de paiement</label>
                <input type="text" [(ngModel)]="conditionsPaiement" placeholder="Ex: 30 jours..." />
              </div>
            </div>
            <div class="field-group full-width">
              <label>Commentaire global</label>
              <textarea [(ngModel)]="commentaireGlobal" rows="2" placeholder="Commentaires..."></textarea>
            </div>
          </div>

          <!-- Articles -->
          <div class="articles-card">
            <h4>Articles ({{ lignesDevis().length }})</h4>

            @if (loadingDetail()) {
              <div class="loading">Chargement des articles...</div>
            } @else {
              <table class="articles-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>DA</th>
                    <th>Qte demandee</th>
                    <th>Prix unitaire HT *</th>
                    <th>Qte disponible</th>
                    <th>Delai (jours)</th>
                    <th>Marque proposee</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ligne of lignesDevis(); track ligne.id; let i = $index) {
                    <tr>
                      <td>
                        <div class="article-cell">
                          <span class="code">{{ ligne.code_article }}</span>
                          <span class="designation">{{ ligne.designation_article || '-' }}</span>
                          @if (ligne.tarif_reference) {
                            <span class="tarif-ref">Ref: {{ ligne.tarif_reference | number:'1.2-2' }}</span>
                          }
                        </div>
                      </td>
                      <td>{{ ligne.numero_da }}</td>
                      <td class="center">{{ ligne.quantite_demandee }}</td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="ligne.prix_unitaire_ht"
                          class="input-small"
                          placeholder="Prix"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="ligne.quantite_disponible"
                          class="input-small"
                          placeholder="Qte"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          [(ngModel)]="ligne.delai_livraison_jours"
                          class="input-small"
                          placeholder="Jours"
                          min="0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          [(ngModel)]="ligne.marque_proposee"
                          class="input-medium"
                          placeholder="Marque"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          [(ngModel)]="ligne.commentaire_article"
                          class="input-medium"
                          placeholder="Note..."
                        />
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="goToStep1()">Retour</button>
            <button class="btn btn-primary" [disabled]="!canSubmitForm()" (click)="goToStep3()">
              Verifier et confirmer
            </button>
          </div>
        </div>
      }

      <!-- Step 3: Confirmation -->
      @if (step() === 3) {
        <div class="step-content">
          <div class="confirmation-card">
            <h2>Confirmation du devis</h2>

            <div class="summary-section">
              <h4>RFQ</h4>
              <p><strong>{{ rfqDetail()?.numero_rfq }}</strong> - {{ rfqDetail()?.nom_fournisseur }}</p>
            </div>

            <div class="summary-section">
              <h4>Informations devis</h4>
              <div class="summary-grid">
                <div>
                  <span class="label">Reference:</span>
                  <span>{{ referenceFournisseur || '-' }}</span>
                </div>
                <div>
                  <span class="label">Devise:</span>
                  <span>{{ devise }}</span>
                </div>
                <div>
                  <span class="label">Conditions:</span>
                  <span>{{ conditionsPaiement || '-' }}</span>
                </div>
              </div>
              @if (commentaireGlobal) {
                <p class="comment"><em>{{ commentaireGlobal }}</em></p>
              }
            </div>

            <div class="summary-section">
              <h4>Articles ({{ getLignesAvecPrix().length }} / {{ lignesDevis().length }})</h4>
              <table class="summary-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Prix HT</th>
                    <th>Qte</th>
                    <th>Delai</th>
                    <th>Marque</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ligne of getLignesAvecPrix(); track ligne.id) {
                    <tr>
                      <td>{{ ligne.code_article }}</td>
                      <td>{{ ligne.prix_unitaire_ht | number:'1.2-2' }} {{ devise }}</td>
                      <td>{{ ligne.quantite_disponible || ligne.quantite_demandee }}</td>
                      <td>{{ ligne.delai_livraison_jours ? ligne.delai_livraison_jours + ' j' : '-' }}</td>
                      <td>{{ ligne.marque_proposee || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (submitError()) {
              <div class="error-message">{{ submitError() }}</div>
            }
          </div>

          <div class="step-actions">
            <button class="btn btn-secondary" (click)="goToStep2()">Modifier</button>
            <button class="btn btn-success" [disabled]="submitting()" (click)="submit()">
              @if (submitting()) {
                Enregistrement...
              } @else {
                Enregistrer le devis
              }
            </button>
          </div>
        </div>
      }

      <!-- Success message -->
      @if (submitSuccess()) {
        <div class="success-overlay">
          <div class="success-card">
            <div class="success-icon">&#10003;</div>
            <h2>Devis enregistre</h2>
            <p>Le devis a ete enregistre avec succes pour le RFQ {{ rfqDetail()?.numero_rfq }}</p>
            <div class="success-actions">
              <button class="btn btn-secondary" (click)="resetForm()">Saisir un autre devis</button>
              <a routerLink="/reponses" class="btn btn-primary">Retour aux offres</a>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      animation: fadeIn 0.3s ease;
      position: relative;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .page-header {
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-link {
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
    }

    .back-link:hover {
      color: #3b82f6;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    /* Stepper */
    .stepper {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .step {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e5e7eb;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .step.active .step-number {
      background: #3b82f6;
      color: white;
    }

    .step.completed .step-number {
      background: #10b981;
      color: white;
    }

    .step-label {
      font-size: 14px;
      color: #6b7280;
    }

    .step.active .step-label {
      color: #1f2937;
      font-weight: 500;
    }

    .step-connector {
      width: 80px;
      height: 2px;
      background: #e5e7eb;
      margin: 0 16px;
    }

    .step-connector.active {
      background: #10b981;
    }

    /* Selection Card */
    .selection-card, .articles-card, .global-info-card, .rfq-header-card, .confirmation-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .selection-card h2, .confirmation-card h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #1f2937;
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .filter-group label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
    }

    .filter-group input, .filter-group select {
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
    }

    .filter-group.full-width {
      flex: 1 1 100%;
    }

    .filter-group textarea {
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      resize: vertical;
    }

    /* RFQ List */
    .rfq-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
    }

    .rfq-item {
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .rfq-item:hover {
      border-color: #3b82f6;
      background: #f0f9ff;
    }

    .rfq-item.selected {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .rfq-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .rfq-number {
      font-weight: 600;
      color: #2d5a87;
    }

    .rfq-statut {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }

    .statut-envoye { background: #dbeafe; color: #1d4ed8; }
    .statut-vu { background: #fef3c7; color: #b45309; }
    .statut-relance_1, .statut-relance_2, .statut-relance_3 { background: #fed7aa; color: #c2410c; }

    .rfq-details {
      font-size: 13px;
      color: #6b7280;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .separator {
      color: #d1d5db;
    }

    /* RFQ Header */
    .rfq-header-card {
      background: linear-gradient(135deg, #2d5a87 0%, #1e40af 100%);
      color: white;
    }

    .rfq-header-card h3 {
      margin: 0 0 4px 0;
      font-size: 18px;
    }

    .rfq-header-card p {
      margin: 0;
      opacity: 0.9;
    }

    /* Global Info */
    .global-info-card h4, .articles-card h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #1f2937;
    }

    .global-fields {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    /* Articles Table */
    .articles-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .articles-table th {
      background: #f9fafb;
      padding: 12px 8px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    .articles-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }

    .articles-table tr:hover td {
      background: #f9fafb;
    }

    .article-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .article-cell .code {
      font-weight: 500;
      color: #1f2937;
    }

    .article-cell .designation {
      font-size: 12px;
      color: #6b7280;
    }

    .article-cell .tarif-ref {
      font-size: 11px;
      color: #059669;
    }

    .center {
      text-align: center;
    }

    .input-small {
      width: 80px;
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 13px;
    }

    .input-medium {
      width: 120px;
      padding: 6px 8px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 13px;
    }

    /* Summary */
    .summary-section {
      margin-bottom: 24px;
    }

    .summary-section h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .summary-grid .label {
      color: #6b7280;
      margin-right: 8px;
    }

    .summary-section .comment {
      margin-top: 12px;
      color: #6b7280;
    }

    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .summary-table th, .summary-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-table th {
      background: #f9fafb;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
    }

    /* Actions */
    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
    }

    .btn-success:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Loading & Empty */
    .loading, .empty {
      padding: 40px;
      text-align: center;
      color: #9ca3af;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-top: 1px solid #e5e7eb;
      margin-top: 16px;
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

    /* Error */
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    /* Success Overlay */
    .success-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .success-card {
      background: white;
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      max-width: 400px;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #10b981;
      color: white;
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .success-card h2 {
      margin: 0 0 12px 0;
      color: #1f2937;
    }

    .success-card p {
      margin: 0 0 24px 0;
      color: #6b7280;
    }

    .success-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
  `]
})
export class SaisieDevisRFQComponent implements OnInit {
  // State
  step = signal(1);
  loadingRFQs = signal(false);
  loadingDetail = signal(false);
  submitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  // Data
  fournisseurs = signal<Fournisseur[]>([]);
  rfqs = signal<RFQPourSaisie[]>([]);
  totalRFQs = signal(0);
  selectedRFQ = signal<RFQPourSaisie | null>(null);
  rfqDetail = signal<RFQDetailPourSaisie | null>(null);
  lignesDevis = signal<LigneDevisForm[]>([]);

  // Filters
  selectedFournisseur = '';
  searchRFQ = '';
  page = 1;
  limit = 20;

  // Form fields
  referenceFournisseur = '';
  devise = 'MAD';
  conditionsPaiement = '';
  commentaireGlobal = '';

  Math = Math;
  private searchTimeout: any;

  // Methods for checking form state (not computed - need to re-evaluate on each call)
  getLignesAvecPrix(): LigneDevisForm[] {
    return this.lignesDevis().filter(l => l.prix_unitaire_ht && l.prix_unitaire_ht > 0);
  }

  canSubmitForm(): boolean {
    return this.getLignesAvecPrix().length > 0;
  }

  constructor(
    private reponseService: ReponseService,
    private fournisseurService: FournisseurService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFournisseurs();
    this.loadRFQs();
  }

  loadFournisseurs(): void {
    this.fournisseurService.getAll({ limit: 500 }).subscribe({
      next: (response) => {
        this.fournisseurs.set(response.fournisseurs);
      }
    });
  }

  loadRFQs(): void {
    this.loadingRFQs.set(true);
    this.reponseService.getRFQsPourSaisie(
      this.page,
      this.limit,
      this.selectedFournisseur || undefined,
      this.searchRFQ || undefined
    ).subscribe({
      next: (response) => {
        this.rfqs.set(response.rfqs);
        this.totalRFQs.set(response.total);
        this.loadingRFQs.set(false);
      },
      error: () => {
        this.loadingRFQs.set(false);
      }
    });
  }

  onFournisseurChange(): void {
    this.page = 1;
    this.loadRFQs();
  }

  onSearchChange(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.loadRFQs();
    }, 300);
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadRFQs();
  }

  selectRFQ(rfq: RFQPourSaisie): void {
    this.selectedRFQ.set(rfq);
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'envoye': 'Envoye',
      'vu': 'Vu',
      'relance_1': 'Relance 1',
      'relance_2': 'Relance 2',
      'relance_3': 'Relance 3'
    };
    return labels[statut] || statut;
  }

  // Step navigation
  goToStep1(): void {
    this.step.set(1);
  }

  goToStep2(): void {
    if (!this.selectedRFQ()) return;

    this.loadingDetail.set(true);
    this.reponseService.getRFQPourSaisie(this.selectedRFQ()!.uuid).subscribe({
      next: (detail) => {
        this.rfqDetail.set(detail);
        // Initialize lignes with form fields
        this.lignesDevis.set(detail.lignes.map(l => ({
          ...l,
          prix_unitaire_ht: undefined,
          quantite_disponible: l.quantite_demandee,
          delai_livraison_jours: undefined,
          marque_proposee: '',
          commentaire_article: ''
        })));
        this.loadingDetail.set(false);
        this.step.set(2);
      },
      error: (err) => {
        this.loadingDetail.set(false);
        alert(err.error?.detail || 'Erreur lors du chargement du RFQ');
      }
    });
  }

  goToStep3(): void {
    if (!this.canSubmitForm()) return;
    this.submitError.set(null);
    this.step.set(3);
  }

  submit(): void {
    if (!this.rfqDetail() || !this.canSubmitForm()) return;

    this.submitting.set(true);
    this.submitError.set(null);

    const request: SaisieDevisRFQRequest = {
      rfq_uuid: this.rfqDetail()!.uuid,
      reference_fournisseur: this.referenceFournisseur || undefined,
      devise: this.devise,
      conditions_paiement: this.conditionsPaiement || undefined,
      commentaire_global: this.commentaireGlobal || undefined,
      lignes: this.getLignesAvecPrix().map(l => ({
        ligne_cotation_id: l.id,
        code_article: l.code_article,
        prix_unitaire_ht: l.prix_unitaire_ht,
        quantite_disponible: l.quantite_disponible,
        delai_livraison_jours: l.delai_livraison_jours,
        marque_proposee: l.marque_proposee || undefined,
        commentaire_article: l.commentaire_article || undefined
      }))
    };

    this.reponseService.saisieDevisRFQ(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.submitError.set(err.error?.detail || 'Erreur lors de l\'enregistrement');
      }
    });
  }

  resetForm(): void {
    this.step.set(1);
    this.selectedRFQ.set(null);
    this.rfqDetail.set(null);
    this.lignesDevis.set([]);
    this.referenceFournisseur = '';
    this.devise = 'MAD';
    this.conditionsPaiement = '';
    this.commentaireGlobal = '';
    this.submitSuccess.set(false);
    this.submitError.set(null);
    this.loadRFQs();
  }
}
