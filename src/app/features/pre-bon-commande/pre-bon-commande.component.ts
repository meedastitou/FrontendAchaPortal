import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SelectionService } from '../../core/services/selection.service';
import {
  PreBCDashboardResponse,
  FournisseurPreBC,
  ArticleSelectionne,
  GenererBCFromPreBCRequest
} from '../../core/models';

@Component({
  selector: 'app-pre-bon-commande',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pre-bon-commande.component.html',
  styleUrl: './pre-bon-commande.component.scss'
})
export class PreBonCommandeComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  generationLoading = signal<string | null>(null); // code_fournisseur en cours

  dashboard = signal<PreBCDashboardResponse | null>(null);

  // Fournisseur selectionne pour voir le detail
  selectedFournisseur = signal<FournisseurPreBC | null>(null);

  // Articles selectionnes pour la generation BC (par fournisseur)
  selectedArticles = signal<Map<string, Set<number>>>(new Map());

  constructor(
    private selectionService: SelectionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.selectionService.getPreBCDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);

        // Initialiser les selections: tous les articles sont selectionnes par defaut
        const map = new Map<string, Set<number>>();
        for (const f of data.fournisseurs) {
          const articleIds = new Set(f.articles.map(a => a.id));
          map.set(f.code_fournisseur, articleIds);
        }
        this.selectedArticles.set(map);
      },
      error: (err) => {
        console.error('Error loading Pre-BC dashboard:', err);
        this.error.set('Impossible de charger les donnees');
        this.loading.set(false);
      }
    });
  }

  // Ouvrir le detail d'un fournisseur
  openFournisseurDetail(fournisseur: FournisseurPreBC): void {
    this.selectedFournisseur.set(fournisseur);
  }

  // Fermer le detail
  closeDetail(): void {
    this.selectedFournisseur.set(null);
  }

  // Toggle selection d'un article
  toggleArticleSelection(codeFournisseur: string, articleId: number): void {
    const map = new Map(this.selectedArticles());
    const articleIds = map.get(codeFournisseur) || new Set();

    if (articleIds.has(articleId)) {
      articleIds.delete(articleId);
    } else {
      articleIds.add(articleId);
    }

    map.set(codeFournisseur, articleIds);
    this.selectedArticles.set(map);
  }

  // Verifier si un article est selectionne
  isArticleSelected(codeFournisseur: string, articleId: number): boolean {
    return this.selectedArticles().get(codeFournisseur)?.has(articleId) ?? false;
  }

  // Compter les articles selectionnes pour un fournisseur
  countSelectedArticles(codeFournisseur: string): number {
    return this.selectedArticles().get(codeFournisseur)?.size ?? 0;
  }

  // Calculer le montant total des articles selectionnes
  calculateSelectedTotal(fournisseur: FournisseurPreBC): number {
    const selectedIds = this.selectedArticles().get(fournisseur.code_fournisseur);
    if (!selectedIds) return 0;

    return fournisseur.articles
      .filter(a => selectedIds.has(a.id))
      .reduce((sum, a) => sum + a.montant_ligne, 0);
  }

  // Selectionner/Deselectionner tous les articles d'un fournisseur
  toggleAllArticles(fournisseur: FournisseurPreBC): void {
    const map = new Map(this.selectedArticles());
    const currentSelected = map.get(fournisseur.code_fournisseur) || new Set();

    if (currentSelected.size === fournisseur.articles.length) {
      // Tout deselectionner
      map.set(fournisseur.code_fournisseur, new Set());
    } else {
      // Tout selectionner
      map.set(fournisseur.code_fournisseur, new Set(fournisseur.articles.map(a => a.id)));
    }

    this.selectedArticles.set(map);
  }

  // Generer le BC pour un fournisseur
  genererBC(fournisseur: FournisseurPreBC): void {
    const selectedIds = this.selectedArticles().get(fournisseur.code_fournisseur);
    if (!selectedIds || selectedIds.size === 0) {
      return;
    }

    this.generationLoading.set(fournisseur.code_fournisseur);

    const request: GenererBCFromPreBCRequest = {
      code_fournisseur: fournisseur.code_fournisseur,
      selection_ids: Array.from(selectedIds)
    };
    console.log('Generating BC with request:', request);
    this.selectionService.genererBC(request).subscribe({
      next: (response) => {
        this.generationLoading.set(null);
        if (response.success && response.numero_bc) {
          // Rediriger vers le detail du BC
          this.router.navigate(['/bon-commande', response.numero_bc]);
        } else {
          alert(response.message);
        }
      },
      error: (err) => {
        console.error('Error generating BC:', err);
        this.generationLoading.set(null);
        alert('Erreur lors de la generation du bon de commande');
      }
    });
  }

  // Retour a la comparaison
  retourComparaison(): void {
    this.router.navigate(['comparaison']);
  }

  // Formater un montant
  formatMontant(montant: number | null): string {
    if (montant === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  // Formater une date
  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }
}
