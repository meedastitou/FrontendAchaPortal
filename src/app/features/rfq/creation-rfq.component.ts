import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RFQService } from '../../core/services/rfq.service';
import {
  FournisseurSelectionRFQ,
  DADisponibleRFQ,
  ArticleDACreationRFQ,
  ArticleSelectionCreate
} from '../../core/models';

interface DASelection {
  numero_da: string;
  articles: ArticleDASelection[];
}

interface ArticleDASelection {
  article: ArticleDACreationRFQ;
  selected: boolean;
}

@Component({
  selector: 'app-creation-rfq',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './creation-rfq.component.html',
  styleUrl: './creation-rfq.component.scss'
})
export class CreationRFQComponent implements OnInit {
  // Fournisseurs
  searchFournisseur = signal('');
  fournisseursDisponibles = signal<FournisseurSelectionRFQ[]>([]);
  fournisseursSelectionnes = signal<FournisseurSelectionRFQ[]>([]);
  loadingFournisseurs = signal(false);

  // DA
  searchDA = signal('');
  daDisponibles = signal<DADisponibleRFQ[]>([]);
  daSelections = signal<DASelection[]>([]);
  loadingDA = signal(false);
  loadingArticles = signal(false);

  // Date limite
  dateLimiteReponse = signal<string>('');

  // État
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed: Articles sélectionnés
  articlesSelectionnes = computed(() => {
    return this.daSelections()
      .flatMap(da => da.articles)
      .filter(a => a.selected);
  });

  // Computed: DA disponibles (non encore ajoutées + filtrées)
  daListFiltrees = computed(() => {
    const alreadyAdded = this.daSelections().map(d => d.numero_da);
    const search = this.searchDA().trim().toUpperCase();
    return this.daDisponibles()
      .filter(da => !alreadyAdded.includes(da.numero_da))
      .filter(da => !search || da.numero_da.toUpperCase().includes(search));
  });

  // Computed: Validation
  canSubmit = computed(() => {
    return this.fournisseursSelectionnes().length > 0 &&
           this.articlesSelectionnes().length > 0;
  });

  private searchFournisseurTimeout: any;
  private searchDATimeout: any;

  constructor(
    private rfqService: RFQService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFournisseurs();
    this.loadDA();
    this.setDefaultDateLimite();
  }

  setDefaultDateLimite(): void {
    // Date limite par défaut: dans 7 jours
    const date = new Date();
    date.setDate(date.getDate() + 7);
    this.dateLimiteReponse.set(date.toISOString().split('T')[0]);
  }

  // ══════════════════════════════════════════════════════════════
  // FOURNISSEURS
  // ══════════════════════════════════════════════════════════════

  loadFournisseurs(): void {
    this.loadingFournisseurs.set(true);
    this.rfqService.searchFournisseurs(this.searchFournisseur(), 50).subscribe({
      next: (response) => {
        // Filtrer les fournisseurs déjà sélectionnés
        const selected = this.fournisseursSelectionnes().map(f => f.code_fournisseur);
        this.fournisseursDisponibles.set(
          response.fournisseurs.filter(f => !selected.includes(f.code_fournisseur))
        );
        this.loadingFournisseurs.set(false);
      },
      error: (err) => {
        console.error('Error loading fournisseurs:', err);
        this.loadingFournisseurs.set(false);
        this.error.set('Erreur lors du chargement des fournisseurs');
      }
    });
  }

  onSearchFournisseur(): void {
    clearTimeout(this.searchFournisseurTimeout);
    this.searchFournisseurTimeout = setTimeout(() => {
      this.loadFournisseurs();
    }, 300);
  }

  ajouterFournisseur(fournisseur: FournisseurSelectionRFQ): void {
    // Ajouter aux sélectionnés
    this.fournisseursSelectionnes.update(list => [...list, fournisseur]);
    // Retirer des disponibles
    this.fournisseursDisponibles.update(list =>
      list.filter(f => f.code_fournisseur !== fournisseur.code_fournisseur)
    );
  }

  supprimerFournisseur(fournisseur: FournisseurSelectionRFQ): void {
    // Retirer des sélectionnés
    this.fournisseursSelectionnes.update(list =>
      list.filter(f => f.code_fournisseur !== fournisseur.code_fournisseur)
    );
    // Remettre dans disponibles
    this.fournisseursDisponibles.update(list => [...list, fournisseur]);
  }

  // ══════════════════════════════════════════════════════════════
  // DA ET ARTICLES
  // ══════════════════════════════════════════════════════════════

  loadDA(): void {
    this.loadingDA.set(true);
    this.rfqService.getDADisponibles().subscribe({
      next: (response) => {
        this.daDisponibles.set(response.da_list);
        this.loadingDA.set(false);
      },
      error: (err) => {
        console.error('Error loading DA:', err);
        this.loadingDA.set(false);
        this.error.set('Erreur lors du chargement des DA');
      }
    });
  }

  onSearchDA(): void {
    clearTimeout(this.searchDATimeout);
    this.searchDATimeout = setTimeout(() => {
      this.rfqService.getDADisponibles(this.searchDA()).subscribe({
        next: (response) => {
          this.daDisponibles.set(response.da_list);
        }
      });
    }, 300);
  }

  ajouterDA(da: DADisponibleRFQ): void {
    // Vérifier si déjà ajoutée
    if (this.daSelections().some(d => d.numero_da === da.numero_da)) {
      return;
    }

    this.loadingArticles.set(true);
    this.error.set(null);

    this.rfqService.getArticlesDA(da.numero_da).subscribe({
      next: (response) => {
        const selections: ArticleDASelection[] = response.articles.map(art => ({
          article: art,
          selected: false
        }));

        const newDA: DASelection = {
          numero_da: da.numero_da,
          articles: selections
        };

        this.daSelections.update(list => [...list, newDA]);
        this.loadingArticles.set(false);
        this.searchDA.set('');
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.loadingArticles.set(false);
        this.error.set('Erreur lors du chargement des articles');
      }
    });
  }

  supprimerDA(numeroDA: string): void {
    this.daSelections.update(list => list.filter(d => d.numero_da !== numeroDA));
  }

  toggleArticle(selection: ArticleDASelection): void {
    selection.selected = !selection.selected;
    this.daSelections.update(list => [...list]);
  }

  selectAllDA(numeroDA: string): void {
    this.daSelections.update(list => list.map(da => {
      if (da.numero_da !== numeroDA) return da;
      return {
        ...da,
        articles: da.articles.map(a => ({ ...a, selected: true }))
      };
    }));
  }

  deselectAllDA(numeroDA: string): void {
    this.daSelections.update(list => list.map(da => {
      if (da.numero_da !== numeroDA) return da;
      return {
        ...da,
        articles: da.articles.map(a => ({ ...a, selected: false }))
      };
    }));
  }

  // ══════════════════════════════════════════════════════════════
  // CRÉATION RFQ
  // ══════════════════════════════════════════════════════════════

  creerRFQ(): void {
    if (!this.canSubmit()) {
      this.error.set('Veuillez sélectionner au moins un fournisseur et un article');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    const articles: ArticleSelectionCreate[] = this.articlesSelectionnes().map(sel => ({
      numero_da: sel.article.numero_da,
      code_article: sel.article.code_article,
      designation_article: sel.article.designation_article,
      quantite: sel.article.quantite,
      unite: sel.article.unite,
      marque_souhaitee: sel.article.marque_souhaitee
    }));

    const request = {
      fournisseurs: this.fournisseursSelectionnes().map(f => f.code_fournisseur),
      articles,
      date_limite_reponse: this.dateLimiteReponse() ? this.dateLimiteReponse() + 'T23:59:59' : null
    };

    this.rfqService.creerRFQManuel(request).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.success.set(
            `${response.nb_rfqs} RFQ créée(s) avec succès!\n` +
            `Numéros: ${response.rfqs_crees.map(r => r.numero_rfq).join(', ')}`
          );
          setTimeout(() => {
            this.router.navigate(['/rfq']);
          }, 3000);
        } else {
          this.error.set(response.message);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.detail || 'Erreur lors de la création des RFQ');
      }
    });
  }

  retour(): void {
    this.router.navigate(['/rfq']);
  }
}
