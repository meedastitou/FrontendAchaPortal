import { Component, OnInit, signal, computed, NgModule, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SelectionService, SuggestionAffaire, AffaireX3  } from '../../core/services/selection.service';
import {
  PreBCDashboardResponse,
  FournisseurPreBC,
  ArticleSelectionne,
  GenererBCFromPreBCRequest
} from '../../core/models';

@Component({
  selector: 'app-pre-bon-commande',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pre-bon-commande.component.html',
  styleUrl: './pre-bon-commande.component.scss'
})
export class PreBonCommandeComponent implements OnInit {
  loading = signal(true);
  error = signal<string | null>(null);
  generationLoading = signal<string | null>(null); // code_fournisseur en cours

  dashboard = signal<PreBCDashboardResponse | null>(null);

  suggestion = signal<SuggestionAffaire | null>(null);
  suggestionLoading = signal(false);
  affaireValidee = signal(false);
  private suggestionSeq = 0;

  // Fournisseur selectionne pour voir le detail
  selectedFournisseur = signal<FournisseurPreBC | null>(null);

  // Valeur de l'affaire (signal separe pour le binding ngModel)
  affaireInput = signal<string>('');
  // Liste des affaires X3 pour le fournisseur selectionne
  affairesX3 = signal<AffaireX3[]>([]);
  // Articles selectionnes pour la generation BC (par fournisseur)
  selectedArticles = signal<Map<string, Set<number>>>(new Map());
  affaireOpen = signal(false);
  rechercheAffaire = signal('');
  changerAffaire = signal(false);
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
  // ── Ids des selections cochees pour un fournisseur ──
  private getSelectedIds(codeFournisseur: string): number[] {
    const f = this.selectedFournisseur();
    if (!f || f.code_fournisseur !== codeFournisseur) return [];
    return f.articles
      .filter(a => this.isArticleSelected(codeFournisseur, a.id))
      .map(a => a.id);
  }

  // Ouvrir le detail d'un fournisseur
  openFournisseurDetail(fournisseur: FournisseurPreBC) {
    this.selectedFournisseur.set(fournisseur);
    this.affaireInput.set('');
    this.affaireValidee.set(false);                 // AJOUT
    this.suggestion.set(null);                      // AJOUT
    this.chargerSuggestion(fournisseur); 
  }
  private chargerListeAffaires(): void {
    if (this.affairesX3().length > 0) return;
    this.selectionService.listeAffaires().subscribe({
      next: (liste) => this.affairesX3.set(liste),
      error: () => this.affairesX3.set([])
    });
  }


    // Liste filtrée par code tier, numéro d'affaire ou raison
  affairesFiltrees = computed(() => {
    const q = this.rechercheAffaire().trim().toLowerCase();
    const liste = this.affairesX3();
    if (!q) return liste;
    return liste.filter(a =>
      a.code_tier.toLowerCase().includes(q) ||
      a.numero_affaire.toLowerCase().includes(q) ||
      (a.raison ?? '').toLowerCase().includes(q)
    );
  });

  // Met le curseur dans la barre de recherche dès que la liste s'ouvre
  @ViewChild('rechercheInput') set rechercheInput(el: ElementRef<HTMLInputElement> | undefined) {
    el?.nativeElement.focus();
  }

  toggleAffaireMenu(): void {
    this.rechercheAffaire.set('');
    this.affaireOpen.set(!this.affaireOpen());
  }

  choisirPremier(): void {
    const premier = this.affairesFiltrees()[0];
    if (premier) this.choisirAffaire(premier.numero_affaire);
  }


  ouvrirChangement(): void {
    this.changerAffaire.set(true);
    this.chargerListeAffaires();
  }

  annulerChangement(): void {
    this.changerAffaire.set(false);
    this.affaireOpen.set(false);
    const s = this.suggestion();
    this.affaireInput.set(s?.trouvee && s.affaire ? s.affaire : '');  // revient à la suggestion
  }

  choisirAffaire(numero: string): void {
    this.affaireInput.set(numero);
    this.rechercheAffaire.set('');
    this.affaireOpen.set(false);
  }

  libelleAffaire(): string {
    const n = this.affaireInput();
    if (!n) return '— Sans affaire —';
    const a = this.affairesX3().find(x => x.numero_affaire === n);
    return a ? `${a.numero_affaire} — ${a.raison || 'Sans raison'}` : n;
  }


  private chargerSuggestion(f: FournisseurPreBC): void {
    const ids = this.getSelectedIds(f.code_fournisseur);
    if (ids.length === 0) {
      this.suggestion.set(null);
      this.suggestionLoading.set(false);
      return;
    }

    const seq = ++this.suggestionSeq;
    this.suggestionLoading.set(true);

    this.selectionService
      .suggererAffaire({ code_fournisseur: f.code_fournisseur, selection_ids: ids })
      .subscribe({
        next: (s: SuggestionAffaire) => {
          if (seq !== this.suggestionSeq) return;
          this.suggestion.set(s);
          this.affaireInput.set(s.trouvee && s.affaire ? s.affaire : '');
          if (!s.trouvee) this.chargerListeAffaires();
          this.suggestionLoading.set(false);
        },
        error: () => {
          if (seq !== this.suggestionSeq) return;
          this.suggestion.set({
            trouvee: false, affaire: null, niveau: 'aucune', nb_affaires: 0, alternatives: [],
            message: "Suggestion indisponible, veuillez saisir l'affaire."
          });
          this.affaireInput.set('');
          this.chargerListeAffaires(); 
          this.suggestionLoading.set(false);
        }
      });
  }

  private rafraichirSuggestion(): void {
    const f = this.selectedFournisseur();
    if (f) this.chargerSuggestion(f);
  }

  onAffaireChange(valeur: string): void {
    this.affaireInput.set(valeur);
    this.affaireValidee.set(false);
  }

  confirmerAffaire(): void {
    if (!this.affaireInput().trim()) return;
    this.affaireValidee.set(true);
  }
  // Fermer le detail
  closeDetail(): void {
    this.selectedFournisseur.set(null);
    this.affaireValidee.set(false);                 // AJOUT
    this.suggestion.set(null);                      // AJOUT
    this.suggestionSeq++; 
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
    this.rafraichirSuggestion();
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
    this.rafraichirSuggestion();
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
      selection_ids: Array.from(selectedIds),
      affaire: this.affaireInput() || ""
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

  // Deselectionner un article (supprimer de la base)
  deselectArticle(article: ArticleSelectionne, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Voulez-vous vraiment deselectionner l'article ${article.code_article} ?`)) {
      return;
    }

    this.selectionService.delete(article.id).subscribe({
      next: () => {
        // Recharger le dashboard
        this.loadDashboard();
        // Fermer le modal si le fournisseur n'a plus d'articles
        const currentFournisseur = this.selectedFournisseur();
        if (currentFournisseur && currentFournisseur.articles.length <= 1) {
          this.closeDetail();
        }
      },
      error: (err) => {
        console.error('Error deleting selection:', err);
        alert('Erreur lors de la deselection');
      }
    });
    this.rafraichirSuggestion();
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
