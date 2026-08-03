import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReponseService } from '../../core/services/reponse.service';
import { ReponseAcheteurComplete } from '../../core/models';

@Component({
  selector: 'app-reponse-acheteur-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/reponses" class="back-link">< Retour</a>
          <h1>Detail Saisie Manuelle</h1>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-card">
          <div class="loading">Chargement...</div>
        </div>
      } @else if (error()) {
        <div class="error-card">
          <p>{{ error() }}</p>
          <a routerLink="/reponses" class="btn btn-primary">Retour a la liste</a>
        </div>
      } @else if (reponse()) {
        <!-- En-tete -->
        <div class="card header-card">
          <div class="header-grid">
            <div class="header-item">
              <span class="label">N RFQ</span>
              <span class="value rfq-number">{{ reponse()!.numero_rfq }}</span>
            </div>
            <div class="header-item">
              <span class="label">N DA</span>
              <span class="value">{{ reponse()!.numero_da }}</span>
            </div>
            <div class="header-item">
              <span class="label">Date saisie</span>
              <span class="value">{{ reponse()!.date_soumission | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="header-item">
              <span class="label">Devise</span>
              <span class="value">{{ reponse()!.devise }}</span>
            </div>
            <div class="header-item">
              <span class="label">Saisi par</span>
              <span class="value">{{ reponse()!.saisi_par_email || '-' }}</span>
            </div>
            @if (reponse()!.conditions_paiement) {
              <div class="header-item">
                <span class="label">Conditions paiement</span>
                <span class="value">{{ reponse()!.conditions_paiement }}</span>
              </div>
            }
          </div>

          @if (reponse()!.commentaire_global) {
            <div class="commentaire">
              <span class="label">Commentaire</span>
              <p>{{ reponse()!.commentaire_global }}</p>
            </div>
          }
        </div>

        <!-- Lignes -->
        <div class="card">
          <h2>Articles ({{ reponse()!.lignes.length }})</h2>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Designation</th>
                  <th>Fournisseur</th>
                  <th>Prix HT</th>
                  <th>Qte dispo</th>
                  <th>Delai</th>
                  <th>Marque</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (ligne of reponse()!.lignes; track ligne.id) {
                  <tr>
                    <td>
                      <span class="article-code">{{ ligne.code_article }}</span>
                    </td>
                    <td>{{ ligne.designation_article || '-' }}</td>
                    <td>
                      <div class="fournisseur-cell">
                        <span class="fournisseur-name">{{ ligne.nom_fournisseur }}</span>
                        <span class="fournisseur-email">{{ ligne.email_fournisseur }}</span>
                      </div>
                    </td>
                    <td>
                      @if (ligne.prix_unitaire_ht) {
                        <span class="prix">{{ ligne.prix_unitaire_ht | number:'1.2-2' }} {{ reponse()!.devise }}</span>
                      } @else {
                        -
                      }
                    </td>
                    <td>{{ ligne.quantite_disponible || '-' }}</td>
                    <td>
                      @if (ligne.delai_livraison_jours) {
                        {{ ligne.delai_livraison_jours }} jours
                      } @else {
                        -
                      }
                    </td>
                    <td>{{ ligne.marque_proposee || '-' }}</td>
                    <td>
                      <span class="statut" [class]="'statut-' + ligne.statut_ligne">
                        {{ ligne.statut_ligne }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Resume par fournisseur -->
        <div class="card">
          <h2>Resume par Fournisseur</h2>
          <div class="fournisseurs-resume">
            @for (f of getFournisseursResume(); track f.nom) {
              <div class="fournisseur-card">
                <div class="fournisseur-header">
                  <span class="fournisseur-name">{{ f.nom }}</span>
                  <span class="fournisseur-count">{{ f.nbArticles }} article(s)</span>
                </div>
                <div class="fournisseur-stats">
                  <div class="stat">
                    <span class="stat-label">Total HT</span>
                    <span class="stat-value">{{ f.totalHT | number:'1.2-2' }} {{ reponse()!.devise }}</span>
                  </div>
                  <div class="stat">
                    <span class="stat-label">Email</span>
                    <span class="stat-value">{{ f.email }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
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
      color: #3b82f6;
      text-decoration: none;
      font-size: 14px;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1e293b;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .card h2 {
      margin: 0 0 20px 0;
      font-size: 18px;
      color: #1e293b;
    }

    .loading-card, .error-card {
      background: white;
      border-radius: 12px;
      padding: 60px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .loading { color: #64748b; }

    .error-card p {
      color: #dc2626;
      margin-bottom: 20px;
    }

    .header-card .header-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
    }

    .header-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .header-item .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
    }

    .header-item .value {
      font-size: 15px;
      color: #1e293b;
      font-weight: 500;
    }

    .rfq-number {
      color: #059669 !important;
    }

    .commentaire {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .commentaire .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      display: block;
      margin-bottom: 8px;
    }

    .commentaire p {
      margin: 0;
      color: #475569;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table th {
      background: #f8fafc;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    .data-table tbody tr:hover {
      background: #f9fafb;
    }

    .article-code {
      color: #3b82f6;
      font-weight: 500;
    }

    .fournisseur-cell {
      display: flex;
      flex-direction: column;
    }

    .fournisseur-name {
      font-weight: 500;
      color: #1e293b;
    }

    .fournisseur-email {
      font-size: 12px;
      color: #64748b;
    }

    .prix {
      font-weight: 600;
      color: #059669;
    }

    .statut {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .statut-en_attente { background: #fef3c7; color: #b45309; }
    .statut-valide { background: #d1fae5; color: #047857; }
    .statut-rejete { background: #fee2e2; color: #dc2626; }

    .fournisseurs-resume {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .fournisseur-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }

    .fournisseur-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .fournisseur-card .fournisseur-name {
      font-weight: 600;
      color: #1e293b;
    }

    .fournisseur-count {
      font-size: 12px;
      color: #64748b;
      background: #f1f5f9;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .fournisseur-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
    }

    .stat-label {
      font-size: 13px;
      color: #64748b;
    }

    .stat-value {
      font-size: 13px;
      color: #1e293b;
      font-weight: 500;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }
  `]
})
export class ReponseAcheteurDetailComponent implements OnInit {
  reponse = signal<ReponseAcheteurComplete | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private reponseService: ReponseService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadReponse(+id);
    } else {
      this.error.set('ID non fourni');
      this.loading.set(false);
    }
  }

  loadReponse(id: number): void {
    this.reponseService.getReponseAcheteur(id).subscribe({
      next: (response) => {
        this.reponse.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.detail || 'Erreur lors du chargement');
        this.loading.set(false);
      }
    });
  }

  getFournisseursResume(): { nom: string; email: string; nbArticles: number; totalHT: number }[] {
    const reponse = this.reponse();
    if (!reponse) return [];

    const map = new Map<string, { nom: string; email: string; nbArticles: number; totalHT: number }>();

    reponse.lignes.forEach(l => {
      const key = l.email_fournisseur;
      if (!map.has(key)) {
        map.set(key, {
          nom: l.nom_fournisseur,
          email: l.email_fournisseur,
          nbArticles: 0,
          totalHT: 0
        });
      }
      const f = map.get(key)!;
      f.nbArticles++;
      f.totalHT += l.prix_unitaire_ht || 0;
    });

    return Array.from(map.values());
  }
}
