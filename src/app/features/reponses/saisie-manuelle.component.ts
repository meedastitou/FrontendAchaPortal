import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReponseService } from '../../core/services/reponse.service';
import { FournisseurService } from '../../core/services/fournisseur.service';
import {
  ArticleDA,
  DAResume,
  ReponseAcheteurRequest,
  LigneReponseAcheteur
} from '../../core/models';

interface LigneFormulaire extends ArticleDA {
  selected: boolean;
  // Fournisseur pour cette ligne
  code_fournisseur: string;
  nom_fournisseur: string;
  email_fournisseur: string;
  telephone_fournisseur: string;
  // Cotation
  prix_unitaire_ht: number | null;
  quantite_disponible: number | null;
  delai_livraison_jours: number | null;
  marque_proposee: string;
  commentaire_ligne: string;
}

interface FournisseurCache {
  code_fournisseur: string;
  nom_fournisseur: string;
  email: string;
  telephone: string;
}

@Component({
  selector: 'app-saisie-manuelle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Saisie Manuelle de Reponse</h1>
        <a routerLink="/reponses" class="btn btn-secondary">Retour</a>
      </div>

      <!-- Etapes -->
      <div class="steps">
        <div class="step" [class.active]="etape() === 1" [class.done]="etape() > 1">
          <span class="step-number">1</span>
          <span class="step-label">DA</span>
        </div>
        <div class="step-line" [class.done]="etape() > 1"></div>
        <div class="step" [class.active]="etape() === 2" [class.done]="etape() > 2">
          <span class="step-number">2</span>
          <span class="step-label">Articles & Fournisseurs</span>
        </div>
        <div class="step-line" [class.done]="etape() > 2"></div>
        <div class="step" [class.active]="etape() === 3">
          <span class="step-number">3</span>
          <span class="step-label">Confirmation</span>
        </div>
      </div>

      <!-- Contenu selon l'etape -->
      <div class="step-content">
        <!-- Etape 1: Selection DA -->
        @if (etape() === 1) {
          <div class="card">
            <h2>Selectionnez une Demande d'Achat</h2>

            <div class="search-box">
              <input
                type="text"
                placeholder="Rechercher par numero DA..."
                [(ngModel)]="searchDA"
                (input)="filterDAs()"
              />
            </div>

            @if (loadingDAs()) {
              <div class="loading">Chargement des DAs...</div>
            } @else if (filteredDAs().length === 0) {
              <div class="empty">Aucune DA disponible</div>
            } @else {
              <div class="da-list">
                @for (da of filteredDAs(); track da.numero_da) {
                  <div
                    class="da-item"
                    [class.selected]="selectedDA() === da.numero_da"
                    (click)="selectDA(da)"
                  >
                    <div class="da-info">
                      <span class="da-numero">{{ da.numero_da }}</span>
                      <span class="da-date">{{ da.date_creation | date:'dd/MM/yyyy' }}</span>
                    </div>
                    <div class="da-meta">
                      <span class="da-articles">{{ da.nb_articles }} article(s)</span>
                      <span class="da-statut" [class]="'statut-' + da.statut">{{ da.statut }}</span>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="step-actions">
              <button
                class="btn btn-primary"
                [disabled]="!selectedDA()"
                (click)="nextStep()"
              >
                Continuer
              </button>
            </div>
          </div>
        }

        <!-- Etape 2: Articles avec fournisseur par ligne -->
        @if (etape() === 2) {
          <div class="card">
            <h2>Saisie des Cotations</h2>
            <p class="subtitle">Pour chaque article, indiquez le fournisseur et le prix propose</p>

            <!-- Infos globales -->
            <div class="global-info">
              <div class="form-row">
                <div class="form-group">
                  <label>Devise</label>
                  <select [(ngModel)]="devise">
                    <option value="MAD">MAD</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Conditions de paiement</label>
                  <input type="text" [(ngModel)]="conditionsPaiement" placeholder="Ex: 30 jours fin de mois" />
                </div>
              </div>
            </div>

            <!-- Fournisseurs rapides -->
            @if (fournisseursCache().length > 0) {
              <div class="quick-suppliers">
                <label>Fournisseurs recents:</label>
                <div class="supplier-chips">
                  @for (f of fournisseursCache(); track f.code_fournisseur) {
                    <button class="chip" (click)="applySupplierToSelected(f)">
                      {{ f.nom_fournisseur }}
                    </button>
                  }
                </div>
              </div>
            }

            @if (loadingArticles()) {
              <div class="loading">Chargement des articles...</div>
            } @else {
              <!-- Articles -->
              <div class="articles-container">
                @for (ligne of lignesFormulaire(); track ligne.code_article; let i = $index) {
                  <div class="article-card" [class.selected]="ligne.selected">
                    <div class="article-header">
                      <label class="checkbox-label">
                        <input type="checkbox" [(ngModel)]="ligne.selected" (ngModelChange)="onFieldChange()" />
                        <span class="article-code">{{ ligne.code_article }}</span>
                      </label>
                      <span class="article-qty">Qte: {{ ligne.quantite }} {{ ligne.unite }}</span>
                    </div>

                    <div class="article-designation">{{ ligne.designation_article || '-' }}</div>

                    @if (ligne.tarif_reference) {
                      <div class="article-ref">Prix ref: {{ ligne.tarif_reference | number:'1.2-2' }} MAD</div>
                    }

                    @if (ligne.selected) {
                      <div class="article-form">
                        <!-- Fournisseur -->
                        <div class="form-section">
                          <div class="section-title">Fournisseur</div>
                          <div class="form-row">
                            <div class="form-group">
                              <label>Nom *</label>
                              <input
                                type="text"
                                [(ngModel)]="ligne.nom_fournisseur"
                                (ngModelChange)="onFieldChange()"
                                placeholder="Nom du fournisseur"
                                required
                                list="fournisseurs-list"
                                (input)="onFournisseurInput(i, $event)"
                              />
                            </div>
                            <div class="form-group">
                              <label>Email *</label>
                              <input
                                type="email"
                                [(ngModel)]="ligne.email_fournisseur"
                                (ngModelChange)="onFieldChange()"
                                placeholder="email&#64;example.com"
                                required
                              />
                            </div>
                            <div class="form-group small">
                              <label>Tel</label>
                              <input
                                type="tel"
                                [(ngModel)]="ligne.telephone_fournisseur"
                                placeholder="+212..."
                              />
                            </div>
                          </div>
                        </div>

                        <!-- Cotation -->
                        <div class="form-section">
                          <div class="section-title">Cotation</div>
                          <div class="form-row">
                            <div class="form-group">
                              <label>Prix HT *</label>
                              <input
                                type="number"
                                [(ngModel)]="ligne.prix_unitaire_ht"
                                (ngModelChange)="onFieldChange()"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                              />
                            </div>
                            <div class="form-group">
                              <label>Qte dispo</label>
                              <input
                                type="number"
                                [(ngModel)]="ligne.quantite_disponible"
                                step="1"
                                min="0"
                                [placeholder]="ligne.quantite.toString()"
                              />
                            </div>
                            <div class="form-group">
                              <label>Delai (jours)</label>
                              <input
                                type="number"
                                [(ngModel)]="ligne.delai_livraison_jours"
                                step="1"
                                min="0"
                                placeholder="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Datalist pour autocompletion -->
              <datalist id="fournisseurs-list">
                @for (f of fournisseurs(); track f.code_fournisseur) {
                  <option [value]="f.nom_fournisseur">{{ f.code_fournisseur }}</option>
                }
              </datalist>
            }

            <div class="form-group">
              <label>Commentaire general</label>
              <textarea [(ngModel)]="commentaireGlobal" rows="2" placeholder="Notes, remarques..."></textarea>
            </div>

            <div class="step-actions">
              <button class="btn btn-secondary" (click)="prevStep()">Retour</button>
              <button
                class="btn btn-primary"
                [disabled]="!articlesValides()"
                (click)="nextStep()"
              >
                Continuer
              </button>
            </div>
          </div>
        }

        <!-- Etape 3: Confirmation -->
        @if (etape() === 3) {
          <div class="card">
            <h2>Recapitulatif</h2>

            <div class="recap-section">
              <h3>Demande d'Achat</h3>
              <p><strong>{{ selectedDA() }}</strong></p>
            </div>

            <div class="recap-section">
              <h3>Infos Globales</h3>
              <p>Devise: {{ devise }}</p>
              @if (conditionsPaiement) {
                <p>Conditions: {{ conditionsPaiement }}</p>
              }
            </div>

            <div class="recap-section">
              <h3>Articles ({{ lignesSelectionnees().length }})</h3>
              <table class="recap-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Fournisseur</th>
                    <th>Prix HT</th>
                    <th>Qte</th>
                    <th>Delai</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ligne of lignesSelectionnees(); track ligne.code_article) {
                    <tr>
                      <td>{{ ligne.code_article }}</td>
                      <td>
                        <div class="fournisseur-cell">
                          <span>{{ ligne.nom_fournisseur }}</span>
                          <small>{{ ligne.email_fournisseur }}</small>
                        </div>
                      </td>
                      <td>{{ ligne.prix_unitaire_ht | number:'1.2-2' }} {{ devise }}</td>
                      <td>{{ ligne.quantite_disponible || ligne.quantite }}</td>
                      <td>{{ ligne.delai_livraison_jours || '-' }} j</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            @if (success()) {
              <div class="success-message">{{ success() }}</div>
            }

            <div class="step-actions">
              <button class="btn btn-secondary" (click)="prevStep()" [disabled]="submitting()">
                Retour
              </button>
              <button
                class="btn btn-success"
                (click)="submit()"
                [disabled]="submitting() || success()"
              >
                @if (submitting()) {
                  Enregistrement...
                } @else {
                  Enregistrer
                }
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
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
      color: #1e293b;
    }

    .subtitle {
      color: #64748b;
      margin-bottom: 20px;
    }

    /* Steps */
    .steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.3s;
    }

    .step.active .step-number { background: #3b82f6; color: white; }
    .step.done .step-number { background: #10b981; color: white; }

    .step-label { font-size: 12px; color: #64748b; }
    .step.active .step-label { color: #3b82f6; font-weight: 600; }

    .step-line {
      width: 80px;
      height: 2px;
      background: #e2e8f0;
      margin: 0 12px;
    }
    .step-line.done { background: #10b981; }

    /* Card */
    .card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .card h2 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #1e293b;
    }

    /* Search */
    .search-box { margin-bottom: 16px; }
    .search-box input {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
    }

    /* DA List */
    .da-list {
      display: grid;
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
    }

    .da-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .da-item:hover { border-color: #3b82f6; background: #f8fafc; }
    .da-item.selected { border-color: #3b82f6; background: #eff6ff; }

    .da-info { display: flex; flex-direction: column; }
    .da-numero { font-weight: 600; color: #1e293b; }
    .da-date { font-size: 12px; color: #64748b; }
    .da-meta { display: flex; gap: 12px; align-items: center; }
    .da-articles { font-size: 13px; color: #64748b; }
    .da-statut {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    .statut-nouveau { background: #dbeafe; color: #1d4ed8; }
    .statut-en_cours { background: #fef3c7; color: #b45309; }
    .statut-cotations_recues { background: #d1fae5; color: #047857; }

    /* Global Info */
    .global-info {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    /* Quick Suppliers */
    .quick-suppliers {
      margin-bottom: 20px;
      padding: 12px;
      background: #eff6ff;
      border-radius: 8px;
    }
    .quick-suppliers label {
      font-size: 12px;
      color: #64748b;
      display: block;
      margin-bottom: 8px;
    }
    .supplier-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip {
      padding: 6px 12px;
      background: white;
      border: 1px solid #3b82f6;
      color: #3b82f6;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
    }
    .chip:hover { background: #3b82f6; color: white; }

    /* Form */
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .form-group.small { max-width: 120px; }

    .form-group label {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    /* Article Cards */
    .articles-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .article-card {
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
    }

    .article-card.selected {
      border-color: #3b82f6;
      background: #fafbff;
    }

    .article-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .article-code {
      font-weight: 600;
      color: #3b82f6;
    }

    .article-qty {
      font-size: 13px;
      color: #64748b;
    }

    .article-designation {
      font-size: 14px;
      color: #475569;
      margin-bottom: 4px;
    }

    .article-ref {
      font-size: 12px;
      color: #10b981;
      margin-bottom: 12px;
    }

    .article-form {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .form-section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    /* Recap */
    .recap-section {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .recap-section h3 {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    .recap-table {
      width: 100%;
      border-collapse: collapse;
    }

    .recap-table th,
    .recap-table td {
      padding: 10px 8px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .recap-table th {
      font-size: 12px;
      color: #64748b;
      background: #f8fafc;
    }

    .fournisseur-cell {
      display: flex;
      flex-direction: column;
    }
    .fournisseur-cell small {
      color: #64748b;
      font-size: 11px;
    }

    /* Messages */
    .error-message {
      padding: 12px;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .success-message {
      padding: 12px;
      background: #f0fdf4;
      color: #16a34a;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    /* Actions */
    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    /* Buttons */
    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      text-decoration: none;
    }

    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .btn-secondary:hover:not(:disabled) { background: #cbd5e1; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover:not(:disabled) { background: #059669; }

    .loading, .empty {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
  `]
})
export class SaisieManuelleComponent implements OnInit {
  // Etape courante (maintenant 3 etapes au lieu de 4)
  etape = signal(1);

  // Etape 1: DAs
  loadingDAs = signal(false);
  das = signal<DAResume[]>([]);
  filteredDAs = signal<DAResume[]>([]);
  searchDA = '';
  selectedDA = signal<string | null>(null);

  // Etape 2: Articles avec fournisseurs
  loadingArticles = signal(false);
  fournisseurs = signal<any[]>([]);
  fournisseursCache = signal<FournisseurCache[]>([]);
  lignesFormulaire = signal<LigneFormulaire[]>([]);
  devise = 'MAD';
  conditionsPaiement = '';
  commentaireGlobal = '';

  // Etape 3: Submission
  submitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed
  lignesSelectionnees = computed(() =>
    this.lignesFormulaire().filter(l =>
      l.selected &&
      l.nom_fournisseur?.trim() &&
      l.email_fournisseur?.trim() &&
      l.prix_unitaire_ht != null &&
      l.prix_unitaire_ht > 0
    )
  );

  constructor(
    private reponseService: ReponseService,
    private fournisseurService: FournisseurService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDAs();
    this.loadFournisseurs();
  }

  loadDAs(): void {
    this.loadingDAs.set(true);
    this.reponseService.listDADisponibles(1, 100).subscribe({
      next: (response) => {
        this.das.set(response.das);
        this.filteredDAs.set(response.das);
        this.loadingDAs.set(false);
      },
      error: () => this.loadingDAs.set(false)
    });
  }

  filterDAs(): void {
    const search = this.searchDA.toLowerCase();
    this.filteredDAs.set(
      this.das().filter(da => da.numero_da.toLowerCase().includes(search))
    );
  }

  selectDA(da: DAResume): void {
    this.selectedDA.set(da.numero_da);
  }

  loadFournisseurs(): void {
    this.fournisseurService.getAll({ limit: 500 }).subscribe({
      next: (response) => {
        this.fournisseurs.set(response.fournisseurs);
        // Cache des 5 premiers fournisseurs pour acces rapide
        this.fournisseursCache.set(
          response.fournisseurs.slice(0, 5).map((f: any) => ({
            code_fournisseur: f.code_fournisseur,
            nom_fournisseur: f.nom_fournisseur,
            email: f.email || '',
            telephone: f.telephone || ''
          }))
        );
      },
      error: () => {}
    });
  }

  loadArticles(): void {
    const da = this.selectedDA();
    if (!da) return;

    this.loadingArticles.set(true);
    this.reponseService.getArticlesDA(da).subscribe({
      next: (response) => {
        this.lignesFormulaire.set(
          response.articles.map(a => ({
            ...a,
            selected: true,
            code_fournisseur: '',
            nom_fournisseur: '',
            email_fournisseur: '',
            telephone_fournisseur: '',
            prix_unitaire_ht: null,
            quantite_disponible: a.quantite,
            delai_livraison_jours: null,
            marque_proposee: '',
            commentaire_ligne: ''
          }))
        );
        this.loadingArticles.set(false);
      },
      error: () => this.loadingArticles.set(false)
    });
  }

  onFournisseurInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Chercher le fournisseur par nom
    const found = this.fournisseurs().find(
      f => f.nom_fournisseur.toLowerCase() === value.toLowerCase()
    );

    if (found) {
      const lignes = this.lignesFormulaire();
      lignes[index].code_fournisseur = found.code_fournisseur;
      lignes[index].email_fournisseur = found.email || '';
      lignes[index].telephone_fournisseur = found.telephone || '';
      this.lignesFormulaire.set([...lignes]);
    }
  }

  applySupplierToSelected(f: FournisseurCache): void {
    const lignes = this.lignesFormulaire();
    lignes.forEach(l => {
      if (l.selected && !l.nom_fournisseur) {
        l.code_fournisseur = f.code_fournisseur;
        l.nom_fournisseur = f.nom_fournisseur;
        l.email_fournisseur = f.email;
        l.telephone_fournisseur = f.telephone;
      }
    });
    this.lignesFormulaire.set([...lignes]);
  }

  onFieldChange(): void {
    // Force signal update by creating new array reference
    this.lignesFormulaire.set([...this.lignesFormulaire()]);
  }

  articlesValides(): boolean {
    return this.lignesSelectionnees().length > 0;
  }

  nextStep(): void {
    if (this.etape() === 1) {
      this.loadArticles();
    }
    this.etape.update(e => e + 1);
  }

  prevStep(): void {
    this.etape.update(e => e - 1);
  }

  submit(): void {
    this.submitting.set(true);
    this.error.set(null);

    const lignes: LigneReponseAcheteur[] = this.lignesSelectionnees().map(l => ({
      code_article: l.code_article,
      code_fournisseur: l.code_fournisseur || undefined,
      nom_fournisseur: l.nom_fournisseur,
      email_fournisseur: l.email_fournisseur,
      telephone_fournisseur: l.telephone_fournisseur || undefined,
      prix_unitaire_ht: l.prix_unitaire_ht!,
      quantite_disponible: l.quantite_disponible || undefined,
      delai_livraison_jours: l.delai_livraison_jours || undefined,
      marque_proposee: l.marque_proposee || undefined,
      commentaire_ligne: l.commentaire_ligne || undefined
    }));

    const request: ReponseAcheteurRequest = {
      numero_da: this.selectedDA()!,
      devise: this.devise,
      conditions_paiement: this.conditionsPaiement || undefined,
      commentaire_global: this.commentaireGlobal || undefined,
      lignes
    };

    this.reponseService.saisieManuelle(request).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.success.set(`${response.message} (RFQ: ${response.numero_rfq})`);

        setTimeout(() => {
          this.router.navigate(['/reponses']);
        }, 2000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.detail || 'Erreur lors de l\'enregistrement');
      }
    });
  }
}
