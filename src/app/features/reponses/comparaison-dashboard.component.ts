import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReponseService } from '../../core/services/reponse.service';
import { SelectionService } from '../../core/services/selection.service';
import { ArticleDashboard, ComparaisonDashboardResponse, SelectionArticle, OffreDashboard } from '../../core/models';

@Component({
  selector: 'app-comparaison-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comparaison-dashboard.component.html',
  styleUrl: './comparaison-dashboard.component.scss'
})
export class ComparaisonDashboardComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  selectionLoading = signal(false);
  selectionMessage = signal<string | null>(null);

  dashboard = signal<ComparaisonDashboardResponse | null>(null);
  searchTerm = signal('');
  selectedArticle = signal<ArticleDashboard | null>(null);

  // Map des selections existantes: key = "code_article|numero_da"
  selectionsMap = signal<Map<string, SelectionArticle>>(new Map());

  // Filtrer les articles par recherche
  filteredArticles = computed(() => {
    const data = this.dashboard();
    if (!data) return [];

    const term = this.searchTerm().toLowerCase();
    if (!term) return data.articles;

    return data.articles.filter(a =>
      a.code_article.toLowerCase().includes(term) ||
      a.designation?.toLowerCase().includes(term) ||
      a.das.some(da => da.toLowerCase().includes(term))
    );
  });

  // Compteur de selections
  nbSelections = computed(() => this.selectionsMap().size);

  constructor(
    private reponseService: ReponseService,
    private selectionService: SelectionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadSelections();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.reponseService.getComparaisonDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading comparison dashboard:', err);
        this.error.set('Impossible de charger les donnees de comparaison');
        this.loading.set(false);
      }
    });
  }

  loadSelections(): void {
    this.selectionService.getAll({ statut: 'selectionne' }).subscribe({
      next: (selections) => {
        const map = new Map<string, SelectionArticle>();
        for (const sel of selections) {
          // Pour chaque DA de l'article
          const key = `${sel.code_article}|${sel.numero_da}`;
          map.set(key, sel);
        }
        this.selectionsMap.set(map);
      },
      error: (err) => {
        console.error('Error loading selections:', err);
      }
    });
  }

  // Selection automatique de tous les articles (meilleur prix)
  selectionAutomatique(): void {
    this.selectionLoading.set(true);
    this.selectionMessage.set(null);

    this.selectionService.selectionAuto().subscribe({
      next: (response) => {
        this.selectionMessage.set(response.message);
        this.loadSelections();
        this.selectionLoading.set(false);

        // Effacer le message apres 3 secondes
        setTimeout(() => this.selectionMessage.set(null), 3000);
      },
      error: (err) => {
        console.error('Error auto-selecting:', err);
        this.selectionMessage.set('Erreur lors de la selection automatique');
        this.selectionLoading.set(false);
      }
    });
  }

  // Selection manuelle d'une offre pour un article
  selectionnerOffre(article: ArticleDashboard, offre: OffreDashboard, numeroDA: string): void {
    this.selectionLoading.set(true);

    // Construire l'objet avec uniquement les champs non-null
    const selectionData: any = {
      code_article: article.code_article,
      numero_da: numeroDA,
      quantite: 1, // TODO: recuperer la quantite demandee
      code_fournisseur: offre.code_fournisseur,
      detail_id: offre.detail_id,
      prix_selectionne: offre.prix_unitaire_ht,
      devise: offre.devise || 'MAD'
    };

    // Ajouter les champs optionnels seulement s'ils ont une valeur
    if (article.designation) selectionData.designation = article.designation;
    if (offre.marque_proposee) selectionData.marque_proposee = offre.marque_proposee;
    if (offre.marque_conforme !== null) selectionData.marque_conforme = offre.marque_conforme;
    if (offre.date_livraison) selectionData.date_livraison = offre.date_livraison.split('T')[0]; // Format YYYY-MM-DD

    // Verifier si une selection existe deja
    const key = `${article.code_article}|${numeroDA}`;
    const existingSelection = this.selectionsMap().get(key);

    if (existingSelection) {
      // Mise a jour - construire l'objet avec uniquement les champs requis
      const updateData: any = {
        code_fournisseur: offre.code_fournisseur,
        detail_id: offre.detail_id,
        prix_selectionne: offre.prix_unitaire_ht,
        devise: offre.devise || 'MAD'
      };
      if (offre.marque_proposee) updateData.marque_proposee = offre.marque_proposee;
      if (offre.marque_conforme !== null) updateData.marque_conforme = offre.marque_conforme;
      if (offre.date_livraison) updateData.date_livraison = offre.date_livraison.split('T')[0];

      this.selectionService.update(existingSelection.id, updateData).subscribe({
        next: () => {
          this.loadSelections();
          this.selectionLoading.set(false);
        },
        error: (err) => {
          console.error('Error updating selection:', err);
          this.selectionLoading.set(false);
        }
      });
    } else {
      // Creation
      this.selectionService.create(selectionData).subscribe({
        next: () => {
          this.loadSelections();
          this.selectionLoading.set(false);
        },
        error: (err) => {
          console.error('Error creating selection:', err);
          this.selectionLoading.set(false);
        }
      });
    }
  }

  // Verifier si une offre est selectionnee pour un article/DA
  isOffreSelectionnee(article: ArticleDashboard, offre: OffreDashboard, numeroDA: string): boolean {
    const key = `${article.code_article}|${numeroDA}`;
    const selection = this.selectionsMap().get(key);
    return selection?.detail_id === offre.detail_id;
  }

  // Verifier si un article a une selection
  hasSelection(article: ArticleDashboard): boolean {
    for (const da of article.das) {
      const key = `${article.code_article}|${da}`;
      if (this.selectionsMap().has(key)) {
        return true;
      }
    }
    return false;
  }

  // Obtenir le fournisseur selectionne pour un article
  getSelectedFournisseur(article: ArticleDashboard): string | null {
    for (const da of article.das) {
      const key = `${article.code_article}|${da}`;
      const selection = this.selectionsMap().get(key);
      if (selection) {
        return selection.nom_fournisseur || selection.code_fournisseur;
      }
    }
    return null;
  }

  // Navigation vers Pre-BC
  allerPreBC(): void {
    this.router.navigate(['pre-bon-commande']);
  }

  selectArticle(article: ArticleDashboard): void {
    this.selectedArticle.set(article);
  }

  closeDetail(): void {
    this.selectedArticle.set(null);
  }

  formatMontant(montant: number | null): string {
    if (montant === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(montant);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  getEcartPrix(article: ArticleDashboard): number {
    if (!article.analyse.prix_min || !article.analyse.prix_max) return 0;
    if (article.analyse.prix_min === 0) return 0;
    return ((article.analyse.prix_max - article.analyse.prix_min) / article.analyse.prix_min) * 100;
  }

  isBestPrice(offre: any, article: ArticleDashboard): boolean {
    return offre.prix_unitaire_ht === article.analyse.prix_min;
  }
}
