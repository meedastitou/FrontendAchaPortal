import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SyncX3Service } from '../../core/services/sync-x3.service';
import {
  StatsX3,
  DAAvecStatutX3,
  DAListX3Filters,
  SyncX3Response,
  LogSyncX3,
  StatsAlertesX3,
  ReponseDANonSignee,
  OffrePrixSuperieurTarif,
  OffreMarqueDifferente,
  DANonSoldeeX3
} from '../../core/models';

type TabType = 'sync' | 'non-signees' | 'prix-superieur' | 'marque-diff' | 'da-x3';

@Component({
  selector: 'app-sync-x3',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Synchronisation et Analyses Sage X3</h1>
        <div class="header-actions">
          <button
            class="btn btn-primary"
            [disabled]="syncing()"
            (click)="synchroniser()"
          >
            @if (syncing()) {
              Synchronisation...
            } @else {
              Synchroniser X3
            }
          </button>
        </div>
      </div>

      <!-- Stats Alertes -->
      @if (statsAlertes()) {
        <div class="alertes-grid">
          <div class="alerte-card" [class.active]="activeTab === 'non-signees'" (click)="setTab('non-signees')">
            <span class="alerte-value">{{ statsAlertes()!.nb_reponses_da_non_signees }}</span>
            <span class="alerte-label">Reponses DA non signees</span>
          </div>
          <div class="alerte-card warning" [class.active]="activeTab === 'prix-superieur'" (click)="setTab('prix-superieur')">
            <span class="alerte-value">{{ statsAlertes()!.nb_offres_prix_superieur }}</span>
            <span class="alerte-label">Prix > Tarif X3</span>
          </div>
          <div class="alerte-card info" [class.active]="activeTab === 'marque-diff'" (click)="setTab('marque-diff')">
            <span class="alerte-value">{{ statsAlertes()!.nb_offres_marque_differente }}</span>
            <span class="alerte-label">Marque differente</span>
          </div>
          <div class="alerte-card" [class.active]="activeTab === 'da-x3'" (click)="setTab('da-x3')">
            <span class="alerte-value">{{ statsAlertes()!.nb_da_non_soldees_x3 || '-' }}</span>
            <span class="alerte-label">DA non soldees X3</span>
          </div>
        </div>
      }

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'sync'" (click)="setTab('sync')">
          Synchronisation
        </button>
        <button class="tab" [class.active]="activeTab === 'non-signees'" (click)="setTab('non-signees')">
          DA Non Signees
        </button>
        <button class="tab" [class.active]="activeTab === 'prix-superieur'" (click)="setTab('prix-superieur')">
          Prix > Tarif
        </button>
        <button class="tab" [class.active]="activeTab === 'marque-diff'" (click)="setTab('marque-diff')">
          Marques Differentes
        </button>
        <button class="tab" [class.active]="activeTab === 'da-x3'" (click)="setTab('da-x3')">
          DA X3
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- TAB: Synchronisation -->
        @if (activeTab === 'sync') {
          @if (syncResult()) {
            <div class="alert" [class.alert-success]="syncResult()!.success">
              <strong>{{ syncResult()!.message }}</strong>
              <button class="btn-close" (click)="syncResult.set(null)">&times;</button>
            </div>
          }

          @if (stats()) {
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-value">{{ stats()!.total_da }}</span>
                <span class="stat-label">Total DA</span>
              </div>
              <div class="stat-card success">
                <span class="stat-value">{{ stats()!.nb_signees }}</span>
                <span class="stat-label">Signees</span>
              </div>
              <div class="stat-card warning">
                <span class="stat-value">{{ stats()!.nb_non_signees }}</span>
                <span class="stat-label">Non Signees</span>
              </div>
              <div class="stat-card info">
                <span class="stat-value">{{ stats()!.nb_signees_non_soldees }}</span>
                <span class="stat-label">Pretes BC</span>
              </div>
              <div class="stat-card danger">
                <span class="stat-value">{{ stats()!.nb_soldees }}</span>
                <span class="stat-label">Soldees</span>
              </div>
            </div>
          }

          <div class="table-card">
            <h3>Historique des synchronisations</h3>
            @if (logs().length > 0) {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Verifiees</th>
                    <th>MAJ</th>
                    <th>Signees</th>
                    <th>Soldees</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of logs(); track log.id) {
                    <tr>
                      <td>{{ log.date_sync | date:'dd/MM HH:mm' }}</td>
                      <td><span class="badge badge-secondary">{{ log.type_sync }}</span></td>
                      <td>{{ log.nb_da_verifiees }}</td>
                      <td>{{ log.nb_da_mises_a_jour }}</td>
                      <td>@if (log.nb_nouvelles_signees > 0) { <span class="badge badge-success">+{{ log.nb_nouvelles_signees }}</span> } @else { 0 }</td>
                      <td>@if (log.nb_nouvelles_soldees > 0) { <span class="badge badge-warning">+{{ log.nb_nouvelles_soldees }}</span> } @else { 0 }</td>
                      <td><span class="badge" [class.badge-success]="log.statut === 'succes'">{{ log.statut }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <p class="empty">Aucun historique</p>
            }
          </div>
        }

        <!-- TAB: Reponses DA Non Signees -->
        @if (activeTab === 'non-signees') {
          <div class="table-card">
            <h3>Reponses fournisseurs sur DA non signees</h3>
            <p class="description">Ces offres existent mais la DA n'est pas encore signee dans Sage X3</p>

            @if (loading()) {
              <div class="loading">Chargement...</div>
            } @else if (reponsesNonSignees().length === 0) {
              <div class="empty">Aucune reponse sur DA non signee</div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>DA</th>
                    <th>Article</th>
                    <th>Fournisseur</th>
                    <th>Prix</th>
                    <th>Qte</th>
                    <th>Signature</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of reponsesNonSignees(); track r.reponse_id) {
                    <tr>
                      <td class="code">{{ r.numero_da }}</td>
                      <td class="code">{{ r.code_article }}</td>
                      <td>{{ r.nom_fournisseur || r.code_fournisseur }}</td>
                      <td class="number">{{ r.prix_unitaire | number:'1.2-2' }}</td>
                      <td>{{ r.quantite_disponible }}</td>
                      <td><span class="badge badge-warning">{{ r.libelle_signature }}</span></td>
                      <td>{{ r.date_reponse | date:'dd/MM' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="pagination">
                <span>{{ totalNonSignees }} resultats</span>
              </div>
            }
          </div>
        }

        <!-- TAB: Prix > Tarif -->
        @if (activeTab === 'prix-superieur') {
          <div class="table-card">
            <h3>Offres avec prix superieur au tarif X3</h3>
            <p class="description">Le prix propose par le fournisseur depasse le tarif de reference dans Sage X3</p>

            @if (loading()) {
              <div class="loading">Chargement...</div>
            } @else if (offresPrixSup().length === 0) {
              <div class="empty">Aucune offre avec prix superieur au tarif</div>
            } @else {
              <div class="summary-box warning">
                Total ecart: <strong>{{ montantEcartTotal | number:'1.2-2' }} DH</strong>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>DA</th>
                    <th>Fournisseur</th>
                    <th>Tarif X3</th>
                    <th>Prix propose</th>
                    <th>Ecart</th>
                  </tr>
                </thead>
                <tbody>
                  @for (o of offresPrixSup(); track o.reponse_id) {
                    <tr>
                      <td class="code">{{ o.code_article }}</td>
                      <td class="code">{{ o.numero_da }}</td>
                      <td>{{ o.nom_fournisseur || o.code_fournisseur }}</td>
                      <td class="number">{{ o.tarif_x3 | number:'1.2-2' }}</td>
                      <td class="number danger">{{ o.prix_propose | number:'1.2-2' }}</td>
                      <td>
                        <span class="badge badge-danger">+{{ o.ecart_pourcent }}%</span>
                        <small>({{ o.ecart_montant | number:'1.2-2' }})</small>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }

        <!-- TAB: Marques Differentes -->
        @if (activeTab === 'marque-diff') {
          <div class="table-card">
            <h3>Offres avec marque differente</h3>
            <p class="description">La marque proposee est differente de la marque souhaitee</p>

            @if (loading()) {
              <div class="loading">Chargement...</div>
            } @else if (offresMarqueDiff().length === 0) {
              <div class="empty">Aucune offre avec marque differente</div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>DA</th>
                    <th>Fournisseur</th>
                    <th>Marque souhaitee</th>
                    <th>Marque proposee</th>
                    <th>Prix</th>
                    <th>X3</th>
                  </tr>
                </thead>
                <tbody>
                  @for (o of offresMarqueDiff(); track o.reponse_id) {
                    <tr>
                      <td class="code">{{ o.code_article }}</td>
                      <td class="code">{{ o.numero_da }}</td>
                      <td>{{ o.nom_fournisseur || o.code_fournisseur }}</td>
                      <td><span class="badge badge-info">{{ o.marque_souhaitee }}</span></td>
                      <td><span class="badge badge-warning">{{ o.marque_proposee }}</span></td>
                      <td class="number">{{ o.prix_propose | number:'1.2-2' }}</td>
                      <td>
                        @if (o.marque_existe_x3) {
                          <span class="badge badge-success" title="Marque existe dans X3">OK</span>
                        } @else {
                          <span class="badge badge-danger" title="Marque non trouvee dans X3">NON</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        }

        <!-- TAB: DA X3 -->
        @if (activeTab === 'da-x3') {
          <div class="table-card">
            <h3>DA non soldees depuis Sage X3</h3>
            <p class="description">Liste directe des DA non soldees depuis la vue Y_DA_NON_SOLDEES</p>

            @if (loading()) {
              <div class="loading">Chargement...</div>
            } @else if (daNonSoldeesX3().length === 0) {
              <div class="empty">Aucune DA non soldee trouvee</div>
            } @else {
              <table class="data-table">
                <thead>
                  <tr>
                    <th>DA</th>
                    <th>Article</th>
                    <th>Designation</th>
                    <th>Qte</th>
                    <th>Marque</th>
                    <th>Famille</th>
                    <th>Portail</th>
                    <th>Reponses</th>
                  </tr>
                </thead>
                <tbody>
                  @for (da of daNonSoldeesX3(); track da.numero_da + da.code_article) {
                    <tr>
                      <td class="code">{{ da.numero_da }}</td>
                      <td class="code">{{ da.code_article }}</td>
                      <td class="designation">{{ da.designation_article || '-' }}</td>
                      <td>{{ da.quantite }} {{ da.unite }}</td>
                      <td>{{ da.marque || '-' }}</td>
                      <td><span class="badge badge-secondary">{{ da.famille }}</span></td>
                      <td>
                        @if (da.existe_portail) {
                          <span class="badge badge-success">Oui</span>
                        } @else {
                          <span class="badge badge-warning">Non</span>
                        }
                      </td>
                      <td>
                        @if (da.nb_reponses > 0) {
                          <span class="badge badge-info">{{ da.nb_reponses }}</span>
                        } @else {
                          0
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              <div class="pagination">
                <span>{{ totalDaNonSoldeesX3 }} resultats</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 20px; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .page-header h1 { margin: 0; font-size: 22px; color: #333; }

    .alertes-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .alerte-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .alerte-card:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    .alerte-card.active { border-color: #007bff; }
    .alerte-card.warning { border-left: 4px solid #ffc107; }
    .alerte-card.info { border-left: 4px solid #17a2b8; }

    .alerte-value { display: block; font-size: 28px; font-weight: bold; color: #333; }
    .alerte-label { display: block; font-size: 11px; color: #666; margin-top: 5px; }

    .tabs {
      display: flex;
      gap: 5px;
      margin-bottom: 20px;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }

    .tab {
      padding: 10px 20px;
      border: none;
      background: #f0f0f0;
      border-radius: 5px 5px 0 0;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
    }

    .tab:hover { background: #e0e0e0; }
    .tab.active { background: #007bff; color: white; }

    .tab-content { background: white; border-radius: 8px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }

    .stat-card.success { border-left: 4px solid #28a745; }
    .stat-card.warning { border-left: 4px solid #ffc107; }
    .stat-card.danger { border-left: 4px solid #dc3545; }
    .stat-card.info { border-left: 4px solid #17a2b8; }

    .stat-value { display: block; font-size: 24px; font-weight: bold; color: #333; }
    .stat-label { display: block; font-size: 11px; color: #666; margin-top: 5px; }

    .table-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .table-card h3 { margin: 0 0 10px; font-size: 16px; color: #333; }
    .table-card .description { color: #666; font-size: 13px; margin-bottom: 15px; }

    .summary-box {
      padding: 10px 15px;
      border-radius: 5px;
      margin-bottom: 15px;
      font-size: 14px;
    }

    .summary-box.warning { background: #fff3cd; color: #856404; }

    .data-table { width: 100%; border-collapse: collapse; }

    .data-table th, .data-table td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
      font-size: 13px;
    }

    .data-table th { background: #f8f9fa; font-weight: 600; color: #333; }
    .data-table tr:hover { background: #f8f9fa; }

    .code { font-family: monospace; font-size: 12px; }
    .number { text-align: right; font-family: monospace; }
    .number.danger { color: #dc3545; font-weight: bold; }
    .designation { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .badge-secondary { background: #e9ecef; color: #495057; }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      font-size: 14px;
      cursor: pointer;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover:not(:disabled) { background: #0056b3; }

    .btn-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: inherit;
      margin-left: 15px;
    }

    .alert {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      border-radius: 5px;
      margin-bottom: 15px;
    }

    .alert-success { background: #d4edda; color: #155724; }

    .loading, .empty { padding: 30px; text-align: center; color: #666; }

    .pagination {
      padding: 10px 0;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #eee;
      margin-top: 10px;
    }
  `]
})
export class SyncX3Component implements OnInit {
  // State
  stats = signal<StatsX3 | null>(null);
  statsAlertes = signal<StatsAlertesX3 | null>(null);
  logs = signal<LogSyncX3[]>([]);
  loading = signal(false);
  syncing = signal(false);
  syncResult = signal<SyncX3Response | null>(null);

  // Data for tabs
  reponsesNonSignees = signal<ReponseDANonSignee[]>([]);
  totalNonSignees = 0;

  offresPrixSup = signal<OffrePrixSuperieurTarif[]>([]);
  montantEcartTotal = 0;

  offresMarqueDiff = signal<OffreMarqueDifferente[]>([]);

  daNonSoldeesX3 = signal<DANonSoldeeX3[]>([]);
  totalDaNonSoldeesX3 = 0;

  // Active tab
  activeTab: TabType = 'sync';

  constructor(private syncService: SyncX3Service) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadStatsAlertes();
    this.loadLogs();
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;

    // Load data for the tab
    switch (tab) {
      case 'non-signees':
        this.loadReponsesNonSignees();
        break;
      case 'prix-superieur':
        this.loadOffresPrixSup();
        break;
      case 'marque-diff':
        this.loadOffresMarqueDiff();
        break;
      case 'da-x3':
        this.loadDANonSoldeesX3();
        break;
    }
  }

  loadStats(): void {
    this.syncService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: (err) => console.error('Erreur stats:', err)
    });
  }

  loadStatsAlertes(): void {
    this.syncService.getStatsAlertes().subscribe({
      next: (stats) => this.statsAlertes.set(stats),
      error: (err) => console.error('Erreur stats alertes:', err)
    });
  }

  loadLogs(): void {
    this.syncService.getLogs(1, 10).subscribe({
      next: (response) => this.logs.set(response.logs),
      error: (err) => console.error('Erreur logs:', err)
    });
  }

  loadReponsesNonSignees(): void {
    this.loading.set(true);
    this.syncService.getReponsesDANonSignees(1, 50).subscribe({
      next: (response) => {
        this.reponsesNonSignees.set(response.items);
        this.totalNonSignees = response.total;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur reponses non signees:', err);
        this.loading.set(false);
      }
    });
  }

  loadOffresPrixSup(): void {
    this.loading.set(true);
    this.syncService.getOffresPrixSuperieurTarif(1, 50).subscribe({
      next: (response) => {
        this.offresPrixSup.set(response.items);
        this.montantEcartTotal = response.montant_ecart_total;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur offres prix:', err);
        this.loading.set(false);
      }
    });
  }

  loadOffresMarqueDiff(): void {
    this.loading.set(true);
    this.syncService.getOffresMarqueDifferente(1, 50).subscribe({
      next: (response) => {
        this.offresMarqueDiff.set(response.items);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur offres marque:', err);
        this.loading.set(false);
      }
    });
  }

  loadDANonSoldeesX3(): void {
    this.loading.set(true);
    this.syncService.getDANonSoldeesX3(1, 100).subscribe({
      next: (response) => {
        this.daNonSoldeesX3.set(response.items);
        this.totalDaNonSoldeesX3 = response.total;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur DA X3:', err);
        this.loading.set(false);
      }
    });
  }

  synchroniser(): void {
    this.syncing.set(true);
    this.syncResult.set(null);

    this.syncService.synchroniser({ force_update: true }).subscribe({
      next: (result) => {
        this.syncResult.set(result);
        this.syncing.set(false);
        this.loadStats();
        this.loadStatsAlertes();
        this.loadLogs();
      },
      error: (err) => {
        console.error('Erreur sync:', err);
        this.syncing.set(false);
      }
    });
  }
}
