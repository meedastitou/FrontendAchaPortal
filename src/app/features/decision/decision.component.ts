import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecisionService } from '../../core/services/decision.service';
import {
  DAEnAttenteDecision,
  DADecisionDetail,
  ArticleComparaison,
  OffreFournisseur,
  CreateCommandeRequest
} from '../../core/models';

interface ArticleSelection {
  code_article: string;
  designation: string | null;
  quantite: number;
  code_fournisseur: string;
  nom_fournisseur: string;
  prix_unitaire_ht: number;
}

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './decision.component.html',
  styleUrl: './decision.component.scss'
})
export class DecisionComponent implements OnInit {
  // Liste des DA
  daList = signal<DAEnAttenteDecision[]>([]);
  totalDA = signal(0);
  totalArticles = signal(0);
  montantMin = signal<number | null>(null);
  montantMax = signal<number | null>(null);
  loading = signal(true);

  // Détail DA sélectionnée
  selectedDA = signal<DADecisionDetail | null>(null);
  loadingDetail = signal(false);

  // Sélection pour commande
  selections = signal<Map<string, ArticleSelection>>(new Map());
  selectedFournisseur = signal<string | null>(null);

  // Création commande
  creatingCommande = signal(false);
  commandeResult = signal<{ success: boolean; message: string; numero?: string } | null>(null);

  // Filtres
  filterPriorite = '';

  page = 1;
  limit = 10;

  constructor(private decisionService: DecisionService) {}

  ngOnInit(): void {
    this.loadDAList();
  }

  loadDAList(): void {
    this.loading.set(true);
    this.decisionService.getDAEnAttente(this.page, this.limit, this.filterPriorite || undefined).subscribe({
      next: (response) => {
        this.daList.set(response.da_list);
        this.totalDA.set(response.total);
        this.totalArticles.set(response.total_articles_a_decider);
        this.montantMin.set(response.montant_potentiel_min);
        this.montantMax.set(response.montant_potentiel_max);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading DA list:', err);
        this.loading.set(false);
      }
    });
  }

  selectDA(da: DAEnAttenteDecision): void {
    this.loadingDetail.set(true);
    this.selectedDA.set(null);
    this.selections.set(new Map());
    this.selectedFournisseur.set(null);
    this.commandeResult.set(null);

    this.decisionService.getDADetail(da.numero_da).subscribe({
      next: (detail) => {
        this.selectedDA.set(detail);
        this.loadingDetail.set(false);

        // Auto-sélectionner le fournisseur recommandé si disponible
        if (detail.fournisseur_recommande_global) {
          this.selectFournisseur(detail.fournisseur_recommande_global);
        }
      },
      error: (err) => {
        console.error('Error loading DA detail:', err);
        this.loadingDetail.set(false);
      }
    });
  }

  closeDetail(): void {
    this.selectedDA.set(null);
    this.selections.set(new Map());
    this.selectedFournisseur.set(null);
    this.commandeResult.set(null);
  }

  selectFournisseur(codeFournisseur: string): void {
    this.selectedFournisseur.set(codeFournisseur);
    const newSelections = new Map<string, ArticleSelection>();
    const da = this.selectedDA();

    if (da) {
      for (const article of da.articles) {
        const offre = article.offres.find(o => o.code_fournisseur === codeFournisseur);
        if (offre && offre.prix_unitaire_ht) {
          newSelections.set(article.code_article, {
            code_article: article.code_article,
            designation: article.designation,
            quantite: article.quantite_demandee,
            code_fournisseur: codeFournisseur,
            nom_fournisseur: offre.nom_fournisseur,
            prix_unitaire_ht: offre.prix_unitaire_ht
          });
        }
      }
    }

    this.selections.set(newSelections);
  }

  selectOffreForArticle(article: ArticleComparaison, offre: OffreFournisseur): void {
    if (!offre.prix_unitaire_ht) return;

    const current = new Map(this.selections());
    current.set(article.code_article, {
      code_article: article.code_article,
      designation: article.designation,
      quantite: article.quantite_demandee,
      code_fournisseur: offre.code_fournisseur,
      nom_fournisseur: offre.nom_fournisseur,
      prix_unitaire_ht: offre.prix_unitaire_ht
    });
    this.selections.set(current);

    // Mettre à jour le fournisseur sélectionné si tous les articles sont du même fournisseur
    const fournisseurs = new Set(Array.from(current.values()).map(s => s.code_fournisseur));
    if (fournisseurs.size === 1) {
      this.selectedFournisseur.set(Array.from(fournisseurs)[0]);
    } else {
      this.selectedFournisseur.set(null);
    }
  }

  isOffreSelected(article: ArticleComparaison, offre: OffreFournisseur): boolean {
    const selection = this.selections().get(article.code_article);
    return selection?.code_fournisseur === offre.code_fournisseur;
  }

  getMontantTotalSelection(): number {
    let total = 0;
    this.selections().forEach(s => {
      total += s.prix_unitaire_ht * s.quantite;
    });
    return total;
  }

  canCreateCommande(): boolean {
    const da = this.selectedDA();
    if (!da) return false;

    // Vérifier qu'au moins un article est sélectionné
    if (this.selections().size === 0) return false;

    // Vérifier que tous les articles sélectionnés sont du même fournisseur
    const fournisseurs = new Set(Array.from(this.selections().values()).map(s => s.code_fournisseur));
    return fournisseurs.size === 1;
  }

  creerCommande(): void {
    const da = this.selectedDA();
    if (!da || !this.canCreateCommande()) return;

    const selections = Array.from(this.selections().values());
    const codeFournisseur = selections[0].code_fournisseur;

    const request: CreateCommandeRequest = {
      numero_da: da.numero_da,
      code_fournisseur: codeFournisseur,
      articles: selections.map(s => ({
        code_article: s.code_article,
        designation: s.designation || '',
        quantite: s.quantite,
        prix_unitaire_ht: s.prix_unitaire_ht
      }))
    };

    this.creatingCommande.set(true);

    this.decisionService.creerCommande(request).subscribe({
      next: (response) => {
        this.commandeResult.set({
          success: response.success,
          message: response.message,
          numero: response.numero_commande || undefined
        });
        this.creatingCommande.set(false);

        if (response.success) {
          // Recharger la liste pour retirer cette DA
          setTimeout(() => {
            this.closeDetail();
            this.loadDAList();
          }, 2000);
        }
      },
      error: (err) => {
        this.commandeResult.set({
          success: false,
          message: err.error?.detail || 'Erreur lors de la création de la commande'
        });
        this.creatingCommande.set(false);
      }
    });
  }

  formatMontant(montant: number | null): string {
    if (montant === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  getPrioriteClass(priorite: string): string {
    const map: Record<string, string> = {
      urgente: 'urgente',
      haute: 'haute',
      normale: 'normale',
      basse: 'basse'
    };
    return map[priorite] || 'normale';
  }

  getScoreClass(score: number | null): string {
    if (score === null) return '';
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'bon';
    if (score >= 40) return 'moyen';
    return 'faible';
  }

  getUniqueFournisseurs(da: DADecisionDetail): { code: string; nom: string }[] {
    const map = new Map<string, string>();
    for (const article of da.articles) {
      for (const offre of article.offres) {
        if (!map.has(offre.code_fournisseur)) {
          map.set(offre.code_fournisseur, offre.nom_fournisseur);
        }
      }
    }
    return Array.from(map.entries()).map(([code, nom]) => ({ code, nom }));
  }
}
