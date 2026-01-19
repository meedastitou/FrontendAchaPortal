import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FournisseurService } from '../../core/services/fournisseur.service';
import { Fournisseur } from '../../core/models';

@Component({
  selector: 'app-fournisseur-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <a routerLink="/fournisseurs" class="back-link">< Retour</a>
        @if (fournisseur()) {
          <h1>{{ fournisseur()!.nom_fournisseur }}</h1>
        }
      </div>

      @if (loading()) {
        <div class="loading-card">Chargement...</div>
      } @else if (fournisseur()) {
        <div class="detail-grid">
          <!-- Infos principales -->
          <div class="card info-card">
            <div class="card-header">
              <h3>Informations</h3>
              @if (fournisseur()!.blacklist) {
                <span class="badge badge-danger">BLACKLISTE</span>
              }
            </div>
            <div class="card-body">
              <div class="info-grid">
                <div class="info-item">
                  <label>Code</label>
                  <span>{{ fournisseur()!.code_fournisseur }}</span>
                </div>
                <div class="info-item">
                  <label>Nom</label>
                  <span>{{ fournisseur()!.nom_fournisseur }}</span>
                </div>
                <div class="info-item">
                  <label>Email</label>
                  <span>{{ fournisseur()!.email || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Telephone</label>
                  <span>{{ fournisseur()!.telephone || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Fax</label>
                  <span>{{ fournisseur()!.fax || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Adresse</label>
                  <span>{{ fournisseur()!.adresse || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Ville</label>
                  <span>{{ fournisseur()!.ville || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Pays</label>
                  <span>{{ fournisseur()!.pays || '-' }}</span>
                </div>
                <div class="info-item">
                  <label>Statut</label>
                  <span class="badge" [class]="'badge-' + fournisseur()!.statut">
                    {{ fournisseur()!.statut }}
                  </span>
                </div>
              </div>

              @if (fournisseur()!.blacklist) {
                <div class="blacklist-info">
                  <h4>Informations Blacklist</h4>
                  <p><strong>Motif:</strong> {{ fournisseur()!.motif_blacklist }}</p>
                  <p><strong>Date:</strong> {{ fournisseur()!.date_blacklist | date:'dd/MM/yyyy' }}</p>
                </div>
              }
            </div>
          </div>

          <!-- Performance -->
          <div class="card">
            <div class="card-header">
              <h3>Performance</h3>
            </div>
            <div class="card-body">
              <div class="perf-stats">
                <div class="perf-item">
                  <span class="perf-value">{{ fournisseur()!.nb_total_rfq }}</span>
                  <span class="perf-label">RFQ recues</span>
                </div>
                <div class="perf-item">
                  <span class="perf-value">{{ fournisseur()!.nb_reponses }}</span>
                  <span class="perf-label">Reponses</span>
                </div>
                <div class="perf-item">
                  <span class="perf-value highlight">{{ fournisseur()!.taux_reponse || 0 }}%</span>
                  <span class="perf-label">Taux de reponse</span>
                </div>
                <div class="perf-item">
                  <span class="perf-value">{{ fournisseur()!.note_performance || '-' }}/5</span>
                  <span class="perf-label">Note</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Historique RFQ -->
          <div class="card full-width">
            <div class="card-header">
              <h3>Historique des RFQ</h3>
            </div>
            <div class="card-body">
              @if (rfqHistory().length > 0) {
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Numero RFQ</th>
                      <th>Date envoi</th>
                      <th>Statut</th>
                      <th>Articles</th>
                      <th>Date reponse</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (rfq of rfqHistory(); track rfq.id) {
                      <tr>
                        <td>
                          <a [routerLink]="['/rfq', rfq.id]" class="code-link">
                            {{ rfq.numero_rfq }}
                          </a>
                        </td>
                        <td>{{ rfq.date_envoi | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td>
                          <span class="badge" [class]="'badge-' + rfq.statut">
                            {{ rfq.statut }}
                          </span>
                        </td>
                        <td>{{ rfq.nb_articles }}</td>
                        <td>{{ rfq.date_reponse ? (rfq.date_reponse | date:'dd/MM/yyyy HH:mm') : '-' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="empty">Aucune RFQ pour ce fournisseur</div>
              }
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
      margin-bottom: 24px;
    }

    .back-link {
      display: inline-block;
      margin-bottom: 12px;
      color: #6b7280;
      text-decoration: none;
      font-size: 14px;
    }

    .back-link:hover {
      color: #2d5a87;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    .loading-card {
      background: white;
      border-radius: 12px;
      padding: 60px;
      text-align: center;
      color: #9ca3af;
    }

    /* Grid Layout */
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .full-width {
      grid-column: span 2;
    }

    @media (max-width: 1024px) {
      .detail-grid {
        grid-template-columns: 1fr;
      }
      .full-width {
        grid-column: span 1;
      }
    }

    /* Cards */
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h3 {
      margin: 0;
      font-size: 16px;
      color: #1f2937;
    }

    .card-body {
      padding: 20px;
    }

    /* Info Grid */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
    }

    .info-item span {
      font-size: 14px;
      color: #1f2937;
    }

    /* Badge */
    .badge {
      display: inline-block;
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
    .badge-envoye { background: #dbeafe; color: #2563eb; }
    .badge-repondu { background: #dcfce7; color: #16a34a; }
    .badge-rejete { background: #fee2e2; color: #dc2626; }
    .badge-relance_1, .badge-relance_2, .badge-relance_3 { background: #fef3c7; color: #d97706; }

    /* Blacklist Info */
    .blacklist-info {
      margin-top: 20px;
      padding: 16px;
      background: #fef2f2;
      border-radius: 8px;
      border: 1px solid #fecaca;
    }

    .blacklist-info h4 {
      margin: 0 0 8px;
      color: #dc2626;
      font-size: 14px;
    }

    .blacklist-info p {
      margin: 4px 0;
      font-size: 13px;
      color: #7f1d1d;
    }

    /* Performance Stats */
    .perf-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .perf-item {
      text-align: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .perf-value {
      display: block;
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }

    .perf-value.highlight {
      color: #22c55e;
    }

    .perf-label {
      font-size: 12px;
      color: #6b7280;
    }

    /* Table */
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
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .code-link {
      color: #2d5a87;
      text-decoration: none;
      font-weight: 500;
    }

    .code-link:hover {
      text-decoration: underline;
    }

    .empty {
      padding: 40px;
      text-align: center;
      color: #9ca3af;
    }
  `]
})
export class FournisseurDetailComponent implements OnInit {
  fournisseur = signal<Fournisseur | null>(null);
  rfqHistory = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private fournisseurService: FournisseurService
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.params['code'];
    this.loadFournisseur(code);
  }

  loadFournisseur(code: string): void {
    this.loading.set(true);

    this.fournisseurService.getByCode(code).subscribe({
      next: (data) => {
        this.fournisseur.set(data);
        this.loading.set(false);
        this.loadRFQHistory(code);
      },
      error: (err) => {
        console.error('Error loading fournisseur:', err);
        this.loading.set(false);
      }
    });
  }

  loadRFQHistory(code: string): void {
    this.fournisseurService.getRFQHistory(code).subscribe({
      next: (data) => this.rfqHistory.set(data.rfqs || []),
      error: (err) => console.error('Error loading RFQ history:', err)
    });
  }
}
