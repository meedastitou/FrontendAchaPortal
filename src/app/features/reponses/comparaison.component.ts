import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReponseService } from '../../core/services/reponse.service';
import { ComparaisonResponse } from '../../core/models';

@Component({
  selector: 'app-comparaison',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Comparaison des Offres</h1>
      </div>

      <!-- Recherche -->
      <div class="search-card">
        <div class="search-form">
          <div class="form-group">
            <label>Code Article</label>
            <input
              type="text"
              placeholder="Entrez le code article..."
              [(ngModel)]="codeArticle"
              (keyup.enter)="search()"
            />
          </div>
          <button class="btn btn-primary" (click)="search()" [disabled]="!codeArticle.trim() || loading()">
            @if (loading()) {
              Recherche...
            } @else {
              Comparer
            }
          </button>
        </div>
      </div>

      @if (comparaison()) {
        <!-- Info Article -->
        <div class="article-info">
          <h2>{{ comparaison()!.code_article }}</h2>
          <p>{{ comparaison()!.designation || 'Sans designation' }}</p>
        </div>

        @if (comparaison()!.offres.length > 0) {
          <!-- Analyse -->
          <div class="analyse-card">
            <h3>Analyse</h3>
            <div class="analyse-grid">
              <div class="analyse-item">
                <span class="analyse-value">{{ comparaison()!.analyse?.nb_offres }}</span>
                <span class="analyse-label">Offres recues</span>
              </div>
              <div class="analyse-item highlight">
                <span class="analyse-value">{{ comparaison()!.analyse?.prix_min | number:'1.2-2' }} MAD</span>
                <span class="analyse-label">Meilleur prix</span>
              </div>
              <div class="analyse-item">
                <span class="analyse-value">{{ comparaison()!.analyse?.prix_max | number:'1.2-2' }} MAD</span>
                <span class="analyse-label">Prix max</span>
              </div>
              <div class="analyse-item">
                <span class="analyse-value">{{ comparaison()!.analyse?.prix_moyen | number:'1.2-2' }} MAD</span>
                <span class="analyse-label">Prix moyen</span>
              </div>
            </div>

            @if (comparaison()!.analyse?.meilleur_fournisseur) {
              <div class="recommandation">
                <span class="rec-label">Fournisseur recommande:</span>
                <span class="rec-value">{{ comparaison()!.analyse?.meilleur_fournisseur }}</span>
              </div>
            }
          </div>

          <!-- Tableau comparatif -->
          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Fournisseur</th>
                  <th>Prix unitaire HT</th>
                  <th>Date livraison</th>
                  <th>Qte disponible</th>
                  <th>Marque</th>
                </tr>
              </thead>
              <tbody>
                @for (offre of comparaison()!.offres; track $index) {
                  <tr [class.best]="$index === 0">
                    <td>
                      <span class="rang" [class.first]="$index === 0">{{ $index + 1 }}</span>
                    </td>
                    <td>
                      <div class="fournisseur-cell">
                        <span class="fournisseur-name">{{ offre.nom_fournisseur }}</span>
                        <span class="fournisseur-code">{{ offre.code_fournisseur }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="prix" [class.best-prix]="$index === 0">
                        {{ offre.prix_unitaire_ht | number:'1.2-4' }} {{ offre.devise }}
                      </span>
                    </td>
                    <td>{{ offre.date_livraison ? (offre.date_livraison | date:'dd/MM/yyyy') : '-' }}</td>
                    <td>{{ offre.quantite_disponible || '-' }}</td>
                    <td>
                      @if (offre.marque_conforme) {
                        <span class="badge badge-success">Conforme</span>
                      } @else if (offre.marque_proposee) {
                        <span class="badge badge-info">{{ offre.marque_proposee }}</span>
                      } @else {
                        <span>-</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="no-offers">
            <p>Aucune offre trouvee pour cet article.</p>
          </div>
        }
      }

      @if (!comparaison() && !loading()) {
        <div class="empty-state">
          <div class="empty-icon">C</div>
          <h3>Comparer les offres</h3>
          <p>Entrez un code article pour voir la comparaison des offres recues de tous les fournisseurs.</p>
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

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    /* Search */
    .search-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .search-form {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .form-group {
      flex: 1;
      max-width: 400px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 15px;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #2d5a87;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, #2d5a87, #1e3a5f);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Article Info */
    .article-info {
      margin-bottom: 20px;
    }

    .article-info h2 {
      margin: 0 0 4px;
      font-size: 20px;
      color: #1f2937;
    }

    .article-info p {
      margin: 0;
      color: #6b7280;
    }

    /* Analyse */
    .analyse-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .analyse-card h3 {
      margin: 0 0 20px;
      font-size: 16px;
      color: #1f2937;
    }

    .analyse-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .analyse-item {
      text-align: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .analyse-item.highlight {
      background: #dcfce7;
    }

    .analyse-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #1f2937;
    }

    .analyse-item.highlight .analyse-value {
      color: #16a34a;
    }

    .analyse-label {
      font-size: 12px;
      color: #6b7280;
    }

    .recommandation {
      margin-top: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #dbeafe, #e0e7ff);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .rec-label {
      font-size: 14px;
      color: #1e40af;
    }

    .rec-value {
      font-size: 16px;
      font-weight: 600;
      color: #1e3a8a;
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
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .data-table tr.best {
      background: #f0fdf4;
    }

    .rang {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f3f4f6;
      font-weight: 600;
      font-size: 12px;
    }

    .rang.first {
      background: #fbbf24;
      color: white;
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

    .prix {
      font-weight: 500;
    }

    .best-prix {
      color: #16a34a;
      font-weight: 700;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-success {
      background: #dcfce7;
      color: #16a34a;
    }

    .badge-info {
      background: #dbeafe;
      color: #2563eb;
    }

    /* Empty States */
    .no-offers, .empty-state {
      background: white;
      border-radius: 12px;
      padding: 60px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
      font-weight: 700;
      color: #9ca3af;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: #1f2937;
    }

    .empty-state p, .no-offers p {
      margin: 0;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .analyse-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class ComparaisonComponent {
  codeArticle = '';
  comparaison = signal<ComparaisonResponse | null>(null);
  loading = signal(false);

  constructor(private reponseService: ReponseService) {}

  search(): void {
    if (!this.codeArticle.trim()) return;

    this.loading.set(true);
    this.reponseService.compareOffersForArticle(this.codeArticle.trim()).subscribe({
      next: (data) => {
        this.comparaison.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error comparing offers:', err);
        this.loading.set(false);
      }
    });
  }
}
