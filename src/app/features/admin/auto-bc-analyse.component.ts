import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AutoBCService } from '../../core/services/auto-bc.service';
import {
  AutoBCPreviewResponse,
  AnalyseAutoBC,
  AnalyseReponseConsultee,
  AnalyseStatutDA,
  AnalysePrixSuperieur,
  AnalyseMarqueProbleme,
  BCPreview
} from '../../core/models';

type TabType = 'reponses' | 'statuts' | 'prix' | 'marques' | 'final';

@Component({
  selector: 'app-auto-bc-analyse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Analyse Auto BC</h1>
        <span class="admin-badge">Admin</span>
      </div>

      <!-- Configuration -->
      <div class="config-card">
        <h3>Configuration de l'analyse</h3>
        <div class="config-grid">
          <div class="config-group">
            <label>Code Famille</label>
            <input
              type="text"
              [(ngModel)]="codeFamille"
              placeholder="46"
            />
          </div>
          <div class="config-group">
            <label>Periode (heures)</label>
            <input
              type="number"
              [(ngModel)]="periodeHeures"
              min="1"
              max="720"
            />
          </div>
          <button
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="lancerAnalyse()"
          >
            @if (loading()) {
              Analyse en cours...
            } @else {
              Lancer l'analyse
            }
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      @if (analyse()) {
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ analyse()!.nb_reponses_consultees }}</span>
            <span class="stat-label">Reponses consultees</span>
          </div>
          <div class="stat-card success">
            <span class="stat-value">{{ analyse()!.nb_da_ok }}</span>
            <span class="stat-label">DA OK</span>
          </div>
          <div class="stat-card danger">
            <span class="stat-value">{{ analyse()!.nb_da_soldees }}</span>
            <span class="stat-label">Lignes DA Soldees</span>
            @if (analyse()!.nb_da_soldees_distinct > 0) {
              <span class="stat-distinct">{{ analyse()!.nb_da_soldees_distinct }} DA distinctes</span>
            }
          </div>
          <div class="stat-card warning">
            <span class="stat-value">{{ analyse()!.nb_da_non_signees }}</span>
            <span class="stat-label">Lignes Non Signees</span>
            @if (analyse()!.nb_da_non_signees_distinct > 0) {
              <span class="stat-distinct">{{ analyse()!.nb_da_non_signees_distinct }} DA distinctes</span>
            }
          </div>
          <div class="stat-card danger">
            <span class="stat-value">{{ analyse()!.nb_prix_superieur }}</span>
            <span class="stat-label">Prix > Tarif X3</span>
            @if (analyse()!.montant_ecart_total > 0) {
              <span class="stat-ecart">{{ analyse()!.montant_ecart_total | number:'1.2-2' }} DH</span>
            }
          </div>
          <div class="stat-card warning">
            <span class="stat-value">{{ analyse()!.nb_marque_non_validee }}</span>
            <span class="stat-label">Marques Non Validees</span>
          </div>
          <div class="stat-card info">
            <span class="stat-value">{{ analyse()!.nb_marque_depuis_xmarqa }}</span>
            <span class="stat-label">Marques depuis X3</span>
          </div>
        </div>

        <!-- Resume -->
        @if (analyse()!.resume) {
          <div class="resume-card">
            <h4>Resume</h4>
            <p>{{ analyse()!.resume }}</p>
          </div>
        }

        <!-- Preview Stats -->
        @if (previewResponse()) {
          <div class="preview-card">
            <h4>Resultats de l'analyse</h4>
            <div class="preview-stats">
              <div class="preview-item">
                <span class="preview-value">{{ previewResponse()!.nb_articles_eligibles }}</span>
                <span class="preview-label">Articles eligibles</span>
              </div>
              <div class="preview-item success">
                <span class="preview-value">{{ previewResponse()!.nb_articles_avec_offre_complete }}</span>
                <span class="preview-label">Offres completes</span>
              </div>
              <div class="preview-item warning">
                <span class="preview-value">{{ previewResponse()!.nb_articles_avec_offre_partielle }}</span>
                <span class="preview-label">Offres partielles</span>
              </div>
              <div class="preview-item">
                <span class="preview-value">{{ previewResponse()!.nb_bc_a_creer }}</span>
                <span class="preview-label">BC a creer</span>
              </div>
              <div class="preview-item info">
                <span class="preview-value">{{ previewResponse()!.economie_totale_estimee | number:'1.2-2' }}</span>
                <span class="preview-label">Economie (DH)</span>
              </div>
            </div>
          </div>
        }

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab" [class.active]="activeTab === 'reponses'" (click)="setTab('reponses')">
            Reponses consultees ({{ analyse()!.nb_reponses_consultees }})
          </button>
          <button class="tab" [class.active]="activeTab === 'statuts'" (click)="setTab('statuts')">
            Statuts DA ({{ analyse()!.statuts_da.length }})
          </button>
          <button class="tab" [class.active]="activeTab === 'prix'" (click)="setTab('prix')">
            Prix > Tarif ({{ analyse()!.nb_prix_superieur }})
          </button>
          <button class="tab" [class.active]="activeTab === 'marques'" (click)="setTab('marques')">
            Problemes Marque ({{ analyse()!.offres_marque_probleme.length }})
          </button>
          <button class="tab tab-success" [class.active]="activeTab === 'final'" (click)="setTab('final')">
            Statut Final ({{ getReponsesValidees().length }})
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- TAB: Reponses consultees -->
          @if (activeTab === 'reponses') {
            <div class="table-card">
              <div class="table-header">
                <h3>Reponses fournisseurs consultees</h3>
                <div class="filter-toggle">
                  <button
                    class="filter-btn"
                    [class.active]="filtreReponses === 'toutes'"
                    (click)="filtreReponses = 'toutes'"
                  >Toutes</button>
                  <button
                    class="filter-btn"
                    [class.active]="filtreReponses === 'incluses'"
                    (click)="filtreReponses = 'incluses'"
                  >Incluses</button>
                  <button
                    class="filter-btn"
                    [class.active]="filtreReponses === 'exclues'"
                    (click)="filtreReponses = 'exclues'"
                  >Exclues</button>
                </div>
              </div>

              @if (reponsesFiltrees().length === 0) {
                <div class="empty">Aucune reponse</div>
              } @else {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DA</th>
                      <th>Article</th>
                      <th>Fournisseur</th>
                      <th>Prix</th>
                      <th>Qte</th>
                      <th>Marque</th>
                      <th>Statut</th>
                      <th>Raison exclusion</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of reponsesFiltrees(); track r.numero_da + r.code_article + r.code_fournisseur) {
                      <tr [class.exclue]="!r.incluse">
                        <td class="code">{{ r.numero_da }}</td>
                        <td class="code">{{ r.code_article }}</td>
                        <td>{{ r.nom_fournisseur || r.code_fournisseur }}</td>
                        <td class="number">{{ r.prix_unitaire_ht | number:'1.2-2' }}</td>
                        <td>{{ r.quantite_disponible }}</td>
                        <td>{{ r.marque_proposee || '-' }}</td>
                        <td>
                          @if (r.incluse) {
                            <span class="badge badge-success">Incluse</span>
                          } @else {
                            <span class="badge badge-danger">Exclue</span>
                          }
                        </td>
                        <td class="raison">{{ r.raison_exclusion || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          }

          <!-- TAB: Statuts DA -->
          @if (activeTab === 'statuts') {
            <div class="table-card">
              <h3>Statuts DA verifies dans Sage X3</h3>

              @if (analyse()!.statuts_da.length === 0) {
                <div class="empty">Aucun statut DA</div>
              } @else {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DA</th>
                      <th>Article</th>
                      <th>Statut X3</th>
                      <th>Signee</th>
                      <th>Ligne Solde</th>
                      <th>DA Solde</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (s of analyse()!.statuts_da; track s.numero_da + s.code_article) {
                      <tr>
                        <td class="code">{{ s.numero_da }}</td>
                        <td class="code">{{ s.code_article }}</td>
                        <td>
                          @switch (s.statut_x3) {
                            @case ('ok') {
                              <span class="badge badge-success">OK</span>
                            }
                            @case ('solde') {
                              <span class="badge badge-danger">Solde</span>
                            }
                            @case ('non_signe') {
                              <span class="badge badge-warning">Non signe</span>
                            }
                            @default {
                              <span class="badge badge-secondary">{{ s.statut_x3 }}</span>
                            }
                          }
                        </td>
                        <td>{{ s.x3_signee ?? '-' }}</td>
                        <td>{{ s.x3_ligne_solde ?? '-' }}</td>
                        <td>{{ s.x3_da_solde ?? '-' }}</td>
                        <td class="message">{{ s.message }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          }

          <!-- TAB: Prix superieur au tarif -->
          @if (activeTab === 'prix') {
            <div class="table-card">
              <h3>Offres avec prix superieur au tarif X3</h3>

              @if (analyse()!.montant_ecart_total > 0) {
                <div class="summary-box warning">
                  Total ecart: <strong>{{ analyse()!.montant_ecart_total | number:'1.2-2' }} DH</strong>
                </div>
              }

              @if (analyse()!.offres_prix_superieur.length === 0) {
                <div class="empty">Aucune offre avec prix superieur au tarif</div>
              } @else {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DA</th>
                      <th>Article</th>
                      <th>Designation</th>
                      <th>Fournisseur</th>
                      <th>Tarif X3</th>
                      <th>Prix propose</th>
                      <th>Ecart</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (o of analyse()!.offres_prix_superieur; track o.numero_da + o.code_article + o.code_fournisseur) {
                      <tr>
                        <td class="code">{{ o.numero_da }}</td>
                        <td class="code">{{ o.code_article }}</td>
                        <td class="designation">{{ o.designation_article || '-' }}</td>
                        <td>{{ o.nom_fournisseur || o.code_fournisseur }}</td>
                        <td class="number">{{ o.tarif_x3 | number:'1.2-2' }}</td>
                        <td class="number danger">{{ o.prix_propose | number:'1.2-2' }}</td>
                        <td>
                          <span class="badge badge-danger">+{{ o.ecart_pourcent | number:'1.1-1' }}%</span>
                          <small>({{ o.ecart_montant | number:'1.2-2' }})</small>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          }

          <!-- TAB: Problemes de marque -->
          @if (activeTab === 'marques') {
            <div class="table-card">
              <h3>Problemes de marque - Validation X3</h3>
              <p class="table-description">
                Regles de validation: 1) Marque existe dans XMARQA, 2) Marque existe dans historique achats (PORDERQ),
                3) Si marque vide, on prend la marque depuis XMARQA.
              </p>

              @if (analyse()!.offres_marque_probleme.length === 0) {
                <div class="empty">Aucun probleme de marque - toutes les marques sont validees</div>
              } @else {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DA</th>
                      <th>Article</th>
                      <th>Fournisseur</th>
                      <th>Marque Proposee</th>
                      <th>XMARQA</th>
                      <th>Historique</th>
                      <th>Statut</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of analyse()!.offres_marque_probleme; track m.numero_da + m.code_article + m.code_fournisseur) {
                      <tr>
                        <td class="code">{{ m.numero_da }}</td>
                        <td class="code">{{ m.code_article }}</td>
                        <td>{{ m.nom_fournisseur || m.code_fournisseur }}</td>
                        <td>
                          @if (m.marque_proposee) {
                            <span class="badge badge-warning">{{ m.marque_proposee }}</span>
                          } @else {
                            <span class="badge badge-secondary">vide</span>
                          }
                        </td>
                        <td>
                          @if (m.valide_xmarqa) {
                            <span class="badge badge-success">OK</span>
                          } @else {
                            <span class="badge badge-danger">NON</span>
                          }
                        </td>
                        <td>
                          @if (m.valide_historique) {
                            <span class="badge badge-success">OK</span>
                          } @else {
                            <span class="badge badge-danger">NON</span>
                          }
                        </td>
                        <td>
                          @switch (m.type_probleme) {
                            @case ('manquante') {
                              <span class="badge badge-warning">Manquante</span>
                            }
                            @case ('non_validee') {
                              <span class="badge badge-danger">Non validee</span>
                            }
                            @default {
                              <span class="badge badge-info">{{ m.type_probleme }}</span>
                            }
                          }
                        </td>
                        <td class="message">{{ m.message || '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          }

          <!-- TAB: Statut Final -->
          @if (activeTab === 'final') {
            <div class="table-card">
              <h3>Reponses Validees - Prets pour BC</h3>
              <p class="table-description">
                Ces reponses ont passe toutes les validations: DA OK, prix conforme, marque validee.
              </p>

              @if (getReponsesValidees().length === 0) {
                <div class="empty">Aucune reponse validee</div>
              } @else {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DA</th>
                      <th>Article</th>
                      <th>Fournisseur</th>
                      <th>Prix</th>
                      <th>Qte</th>
                      <th>Marque</th>
                      <th>Source Marque</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of getReponsesValidees(); track r.numero_da + r.code_article + r.code_fournisseur) {
                      <tr class="row-success">
                        <td class="code">{{ r.numero_da }}</td>
                        <td class="code">{{ r.code_article }}</td>
                        <td>{{ r.nom_fournisseur || r.code_fournisseur }}</td>
                        <td class="number">{{ r.prix_unitaire_ht | number:'1.2-2' }}</td>
                        <td>{{ r.quantite_disponible }}</td>
                        <td>
                          @if (getMarqueFinale(r.code_article, r.code_fournisseur)) {
                            <span class="badge" [class.badge-success]="!isMarqueFromX3(r.code_article, r.code_fournisseur)" [class.badge-x3]="isMarqueFromX3(r.code_article, r.code_fournisseur)">
                              {{ getMarqueFinale(r.code_article, r.code_fournisseur) }}
                            </span>
                          } @else {
                            <span class="badge badge-secondary">-</span>
                          }
                        </td>
                        <td>
                          @if (isMarqueFromX3(r.code_article, r.code_fournisseur)) {
                            <span class="badge badge-x3-source">XMARQA</span>
                          } @else {
                            <span class="badge badge-info">Proposee</span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>

            <!-- Marques Recuperees depuis X3 -->
            @if (getMarquesRecupereesX3().length > 0) {
              <div class="table-card marques-x3-section">
                <h3>Marques Recuperees depuis X3 ({{ getMarquesRecupereesX3().length }})</h3>
                <p class="table-description">
                  Ces marques etaient vides ou non valides dans les reponses fournisseurs et ont ete recuperees depuis XMARQA.
                </p>

                <table class="data-table">
                  <thead>
                    <tr>
                      <th>DA</th>
                      <th>Article</th>
                      <th>Fournisseur</th>
                      <th>Marque Proposee</th>
                      <th>Marque X3</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of getMarquesRecupereesX3(); track m.numero_da + m.code_article + m.code_fournisseur) {
                      <tr class="row-x3">
                        <td class="code">{{ m.numero_da }}</td>
                        <td class="code">{{ m.code_article }}</td>
                        <td>{{ m.nom_fournisseur || m.code_fournisseur }}</td>
                        <td>
                          @if (m.marque_proposee) {
                            <span class="badge badge-secondary">{{ m.marque_proposee }}</span>
                          } @else {
                            <span class="badge badge-warning">vide</span>
                          }
                        </td>
                        <td>
                          <span class="badge badge-x3">{{ m.marque_finale }}</span>
                        </td>
                        <td>
                          <span class="badge badge-info">XMARQA</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- BC Preview -->
            @if (previewResponse() && previewResponse()!.bcs_preview.length > 0) {
              <div class="bc-preview-section">
                <h3>BC a Creer ({{ previewResponse()!.nb_bc_a_creer }})</h3>

                @for (bc of previewResponse()!.bcs_preview; track bc.code_fournisseur) {
                  <div class="bc-card">
                    <div class="bc-header">
                      <div class="bc-fournisseur">
                        <span class="bc-avatar">{{ bc.nom_fournisseur?.charAt(0) || 'F' }}</span>
                        <div>
                          <h4>{{ bc.nom_fournisseur || bc.code_fournisseur }}</h4>
                          <span class="bc-code">{{ bc.code_fournisseur }}</span>
                        </div>
                      </div>
                      <div class="bc-totaux">
                        <div class="bc-total">
                          <span class="bc-total-label">Total HT</span>
                          <span class="bc-total-value">{{ bc.montant_total_ht | number:'1.2-2' }} DH</span>
                        </div>
                        <div class="bc-total">
                          <span class="bc-total-label">Total TTC</span>
                          <span class="bc-total-value highlight">{{ bc.montant_total_ttc | number:'1.2-2' }} DH</span>
                        </div>
                      </div>
                    </div>

                    <div class="bc-das">
                      <span class="bc-das-label">DA incluses:</span>
                      @for (da of bc.das_incluses; track da) {
                        <span class="da-chip">{{ da }}</span>
                      }
                    </div>

                    <table class="bc-lignes-table">
                      <thead>
                        <tr>
                          <th>Article</th>
                          <th>Designation</th>
                          <th>DA</th>
                          <th>Qte</th>
                          <th>Prix U.</th>
                          <th>Montant</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (ligne of bc.lignes; track ligne.code_article + ligne.numero_da) {
                          <tr>
                            <td class="code">{{ ligne.code_article }}</td>
                            <td class="designation">{{ ligne.designation_article || '-' }}</td>
                            <td class="code">{{ ligne.numero_da }}</td>
                            <td>{{ ligne.quantite_commandee }}</td>
                            <td class="number">{{ ligne.prix_unitaire_ht | number:'1.2-2' }}</td>
                            <td class="number montant">{{ ligne.montant_ligne_ht | number:'1.2-2' }}</td>
                            <td>
                              @if (ligne.type_livraison === 'COMPLET') {
                                <span class="badge badge-success">Complet</span>
                              } @else {
                                <span class="badge badge-warning">Partiel</span>
                              }
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            }
          }
        </div>
      } @else if (!loading()) {
        <div class="empty-state">
          <p>Configurez les parametres et lancez l'analyse pour voir les resultats.</p>
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

    /* Config Card */
    .config-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .config-card h3 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #374151;
    }

    .config-grid {
      display: flex;
      gap: 20px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .config-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .config-group label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
    }

    .config-group input {
      padding: 10px 14px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      width: 150px;
    }

    .config-group input:focus {
      outline: none;
      border-color: #7c3aed;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-card.success { border-left: 4px solid #22c55e; }
    .stat-card.danger { border-left: 4px solid #ef4444; }
    .stat-card.warning { border-left: 4px solid #f59e0b; }
    .stat-card.info { border-left: 4px solid #3b82f6; }

    .stat-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .stat-ecart {
      display: block;
      font-size: 11px;
      color: #ef4444;
      margin-top: 4px;
    }

    .stat-distinct {
      display: block;
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
      font-weight: 500;
    }

    /* Resume Card */
    .resume-card {
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      border-left: 4px solid #3b82f6;
    }

    .resume-card h4 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #1e40af;
    }

    .resume-card p {
      margin: 0;
      font-size: 13px;
      color: #1e3a5f;
      line-height: 1.5;
    }

    /* Preview Card */
    .preview-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .preview-card h4 {
      margin: 0 0 16px;
      font-size: 16px;
      color: #374151;
    }

    .preview-stats {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }

    .preview-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .preview-item.success { background: #dcfce7; }
    .preview-item.warning { background: #fef3c7; }
    .preview-item.info { background: #dbeafe; }

    .preview-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }

    .preview-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 12px;
    }

    .tab {
      padding: 10px 20px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      color: #374151;
    }

    .tab:hover {
      background: #e5e7eb;
    }

    .tab.active {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: white;
    }

    .tab-content {
      background: white;
      border-radius: 12px;
    }

    /* Table Card */
    .table-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .table-card h3 {
      margin: 0 0 8px;
      font-size: 16px;
      color: #374151;
    }

    .table-description {
      font-size: 12px;
      color: #6b7280;
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .filter-toggle {
      display: flex;
      gap: 4px;
    }

    .filter-btn {
      padding: 6px 12px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      background: #f3f4f6;
    }

    .filter-btn.active {
      background: #7c3aed;
      color: white;
      border-color: #7c3aed;
    }

    /* Data Table */
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

    .data-table tr.exclue td {
      background: #fef2f2;
      color: #9ca3af;
    }

    .code {
      font-family: monospace;
      font-weight: 500;
    }

    .number {
      text-align: right;
      font-family: monospace;
    }

    .number.danger {
      color: #dc2626;
      font-weight: 600;
    }

    .designation {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .raison, .message {
      font-size: 11px;
      color: #6b7280;
      max-width: 200px;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-danger { background: #fee2e2; color: #dc2626; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-info { background: #dbeafe; color: #2563eb; }
    .badge-secondary { background: #f3f4f6; color: #6b7280; }

    /* Summary Box */
    .summary-box {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .summary-box.warning {
      background: #fef3c7;
      color: #92400e;
    }

    /* Buttons */
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

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Empty States */
    .empty, .empty-state {
      padding: 40px;
      text-align: center;
      color: #9ca3af;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    /* Tab Success (Statut Final) */
    .tab-success {
      background: #dcfce7 !important;
      color: #16a34a !important;
    }

    .tab-success:hover {
      background: #bbf7d0 !important;
    }

    .tab-success.active {
      background: linear-gradient(135deg, #22c55e, #16a34a) !important;
      color: white !important;
    }

    .row-success td {
      background: #f0fdf4 !important;
    }

    .row-success:hover td {
      background: #dcfce7 !important;
    }

    /* BC Preview Section */
    .bc-preview-section {
      margin-top: 24px;
    }

    .bc-preview-section h3 {
      margin: 0 0 16px;
      font-size: 18px;
      color: #16a34a;
    }

    .bc-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      margin-bottom: 20px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .bc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border-bottom: 1px solid #bbf7d0;
    }

    .bc-fournisseur {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bc-avatar {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
    }

    .bc-fournisseur h4 {
      margin: 0 0 4px;
      font-size: 16px;
      color: #1f2937;
    }

    .bc-code {
      font-size: 12px;
      color: #6b7280;
      font-family: monospace;
    }

    .bc-totaux {
      display: flex;
      gap: 24px;
    }

    .bc-total {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .bc-total-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .bc-total-value {
      font-size: 18px;
      font-weight: 700;
      color: #374151;
    }

    .bc-total-value.highlight {
      color: #16a34a;
    }

    .bc-das {
      padding: 12px 20px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .bc-das-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .da-chip {
      background: #dbeafe;
      color: #2563eb;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      font-family: monospace;
    }

    .bc-lignes-table {
      width: 100%;
      border-collapse: collapse;
    }

    .bc-lignes-table th,
    .bc-lignes-table td {
      padding: 10px 16px;
      text-align: left;
      font-size: 13px;
    }

    .bc-lignes-table th {
      background: #f3f4f6;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .bc-lignes-table td {
      border-top: 1px solid #e5e7eb;
      color: #374151;
    }

    .bc-lignes-table .montant {
      color: #16a34a;
      font-weight: 600;
    }

    /* Marques Recuperees X3 Section */
    .marques-x3-section {
      margin-top: 24px;
      border-left: 4px solid #7c3aed;
    }

    .marques-x3-section h3 {
      color: #7c3aed;
    }

    .row-x3 td {
      background: #f5f3ff !important;
    }

    .row-x3:hover td {
      background: #ede9fe !important;
    }

    .badge-x3 {
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      color: white;
      font-weight: 600;
    }

    .badge-x3-source {
      background: #7c3aed;
      color: white;
      font-weight: 600;
    }
  `]
})
export class AutoBCAnalyseComponent {
  // Configuration
  codeFamille = '46';
  periodeHeures = 24;

  // State
  loading = signal(false);
  previewResponse = signal<AutoBCPreviewResponse | null>(null);
  analyse = signal<AnalyseAutoBC | null>(null);

  // Tabs
  activeTab: TabType = 'reponses';
  filtreReponses: 'toutes' | 'incluses' | 'exclues' = 'toutes';

  constructor(private autoBCService: AutoBCService) {}

  lancerAnalyse(): void {
    this.loading.set(true);
    this.previewResponse.set(null);
    this.analyse.set(null);

    this.autoBCService.getPreview(this.codeFamille, this.periodeHeures).subscribe({
      next: (response) => {
        this.previewResponse.set(response);
        this.analyse.set(response.analyse);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur analyse Auto BC:', err);
        this.loading.set(false);
      }
    });
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  reponsesFiltrees(): AnalyseReponseConsultee[] {
    const reponses = this.analyse()?.reponses_consultees || [];

    switch (this.filtreReponses) {
      case 'incluses':
        return reponses.filter(r => r.incluse);
      case 'exclues':
        return reponses.filter(r => !r.incluse);
      default:
        return reponses;
    }
  }

  getReponsesValidees(): AnalyseReponseConsultee[] {
    const reponses = this.analyse()?.reponses_consultees || [];
    return reponses.filter(r => r.incluse);
  }

  getMarquesRecupereesX3(): AnalyseMarqueProbleme[] {
    const marques = this.analyse()?.offres_marque_probleme || [];
    // Filtrer les marques qui ont ete recuperees avec succes depuis X3
    return marques.filter(m => m.type_probleme === 'recuperee_x3' && m.marque_finale);
  }

  // Trouver l'info marque pour un article/fournisseur
  private findMarqueInfo(codeArticle: string, codeFournisseur: string): AnalyseMarqueProbleme | undefined {
    const marques = this.analyse()?.offres_marque_probleme || [];
    return marques.find(m => m.code_article === codeArticle && m.code_fournisseur === codeFournisseur);
  }

  // Retourne la marque finale a utiliser (proposee ou depuis X3)
  getMarqueFinale(codeArticle: string, codeFournisseur: string): string | null {
    // Le backend met maintenant a jour marque_proposee avec la marque finale
    // (soit proposee par le fournisseur, soit recuperee de X3)
    const reponse = this.analyse()?.reponses_consultees.find(
      r => r.code_article === codeArticle && r.code_fournisseur === codeFournisseur
    );

    return reponse?.marque_proposee || null;
  }

  // Verifie si la marque vient de X3 (XMARQA)
  isMarqueFromX3(codeArticle: string, codeFournisseur: string): boolean {
    const marqueInfo = this.findMarqueInfo(codeArticle, codeFournisseur);
    // La marque vient de X3 si type_probleme est 'recuperee_x3'
    return marqueInfo?.type_probleme === 'recuperee_x3' && !!marqueInfo?.marque_finale;
  }
}
