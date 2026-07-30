import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import { LigneCanevaBCCreate, GenerateCanevaBCRequest, EnvoyerBCRPAResponse } from '../../core/models/bon-commande.model';

interface ArticleX3 {
  numero_da: string;
  code_article: string;
  designation_article: string;
  quantite: number;
  marque: string;
  unite: string;
  famille: string;
}

interface ArticleSelection {
  article: ArticleX3;
  selected: boolean;
  prix: number;
  marque: string;
  affaire: string;
  tarif_max: number | null;
  marques_disponibles: string[];
  loading_tarif: boolean;
  loading_marques: boolean;
  prix_error: string | null;
}

interface DASelection {
  numero_da: string;
  articles: ArticleSelection[];
}

@Component({
  selector: 'app-caneva-bc',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './caneva-bc.component.html',
  styleUrl: './caneva-bc.component.scss'
})
export class CanevaBCComponent implements OnInit {
  // Fournisseur
  codeFournisseur = signal<string>('');

  // DA
  daList = signal<string[]>([]);
  loadingDA = signal(false);
  selectedDA = signal<string>('');  // DA en cours de sélection (dropdown)
  daSelections = signal<DASelection[]>([]);  // Liste des DA ajoutées
  searchDA = signal<string>('');  // Recherche DA

  // Articles (tous les articles de toutes les DA)
  loadingArticles = signal(false);

  // État
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed: Tous les articles de toutes les DA
  articles = computed(() => {
    return this.daSelections().flatMap(da => da.articles);
  });

  // Computed: Articles sélectionnés
  articlesSelectionnes = computed(() => {
    return this.articles().filter(a => a.selected);
  });

  // Computed: Total HT
  totalHT = computed(() => {
    return this.articlesSelectionnes().reduce((sum, a) => sum + (a.article.quantite * a.prix), 0);
  });

  // Computed: DA disponibles (non encore ajoutées + filtrées par recherche)
  daListDisponibles = computed(() => {
    const alreadyAdded = this.daSelections().map(d => d.numero_da);
    const search = this.searchDA().trim().toUpperCase();
    return this.daList()
      .filter(da => !alreadyAdded.includes(da))
      .filter(da => !search || da.toUpperCase().includes(search));
  });

  // Computed: Validation
  canSubmit = computed(() => {
    const selected = this.articlesSelectionnes();
    if (selected.length === 0) return false;
    if (!this.codeFournisseur().trim()) return false;

    // Vérifier que tous les articles sélectionnés ont un prix valide
    for (const a of selected) {
      if (a.prix <= 0) return false;
      if (a.prix_error) return false;
    }
    return true;
  });

  constructor(
    private bcService: BonCommandeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDAList();
  }

  loadDAList(): void {
    this.loadingDA.set(true);
    this.bcService.getCanevaDADisponibles().subscribe({
      next: (response) => {
        this.daList.set(response.da_list);
        this.loadingDA.set(false);
      },
      error: (err) => {
        console.error('Error loading DA list:', err);
        this.loadingDA.set(false);
        this.error.set('Erreur lors du chargement des DA');
      }
    });
  }

  onDAChange(): void {
    // Cette méthode n'ajoute plus automatiquement la DA
    // Elle est appelée quand le dropdown change
  }

  ajouterDA(): void {
    const da = this.selectedDA();
    if (!da) {
      return;
    }

    // Vérifier si la DA n'est pas déjà ajoutée
    if (this.daSelections().some(d => d.numero_da === da)) {
      this.error.set('Cette DA est déjà ajoutée');
      return;
    }

    this.loadingArticles.set(true);
    this.error.set(null);

    this.bcService.getCanevaArticlesDA(da).subscribe({
      next: (response) => {
        const selections: ArticleSelection[] = response.articles.map(art => ({
          article: art,
          selected: false,
          prix: 0,
          marque: art.marque || '',
          affaire: '',
          tarif_max: null,
          marques_disponibles: [],
          loading_tarif: false,
          loading_marques: false,
          prix_error: null
        }));

        // Ajouter la DA à la liste
        const newDASelection: DASelection = {
          numero_da: da,
          articles: selections
        };
        this.daSelections.update(das => [...das, newDASelection]);
        this.loadingArticles.set(false);

        // Réinitialiser le dropdown et la recherche
        this.selectedDA.set('');
        this.searchDA.set('');

        // Charger tarifs et marques pour chaque article
        for (const sel of selections) {
          this.loadTarifMax(sel);
          this.loadMarques(sel);
        }
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.loadingArticles.set(false);
        this.error.set('Erreur lors du chargement des articles');
      }
    });
  }

  supprimerDA(numeroDA: string): void {
    this.daSelections.update(das => das.filter(d => d.numero_da !== numeroDA));
  }

  loadTarifMax(selection: ArticleSelection): void {
    selection.loading_tarif = true;
    this.bcService.getCanevaTarifMax(selection.article.code_article).subscribe({
      next: (response) => {
        selection.tarif_max = response.tarif_max;
        selection.loading_tarif = false;
        this.daSelections.update(das => [...das]);
      },
      error: () => {
        selection.loading_tarif = false;
        this.daSelections.update(das => [...das]);
      }
    });
  }

  loadMarques(selection: ArticleSelection): void {
    selection.loading_marques = true;
    this.bcService.getCanevaMarques(selection.article.code_article).subscribe({
      next: (response) => {
        selection.marques_disponibles = response.marques;
        selection.loading_marques = false;
        this.daSelections.update(das => [...das]);
      },
      error: () => {
        selection.loading_marques = false;
        this.daSelections.update(das => [...das]);
      }
    });
  }

  onPrixChange(selection: ArticleSelection): void {
    if (selection.tarif_max !== null && selection.prix > selection.tarif_max) {
      selection.prix_error = `Prix max: ${this.formatMontant(selection.tarif_max)} MAD`;
    } else {
      selection.prix_error = null;
    }
    this.daSelections.update(das => [...das]);
  }

  toggleSelection(selection: ArticleSelection): void {
    selection.selected = !selection.selected;
    this.daSelections.update(das => [...das]);
  }

  selectAll(numeroDA?: string): void {
    this.daSelections.update(das => das.map(da => {
      if (numeroDA && da.numero_da !== numeroDA) return da;
      return {
        ...da,
        articles: da.articles.map(a => ({ ...a, selected: true }))
      };
    }));
  }

  deselectAll(numeroDA?: string): void {
    this.daSelections.update(das => das.map(da => {
      if (numeroDA && da.numero_da !== numeroDA) return da;
      return {
        ...da,
        articles: da.articles.map(a => ({ ...a, selected: false }))
      };
    }));
  }

  envoyerAuRPA(): void {
    this.error.set(null);
    this.success.set(null);

    if (!this.canSubmit()) {
      this.error.set('Veuillez corriger les erreurs avant d\'envoyer');
      return;
    }

    this.saving.set(true);

    const lignes: LigneCanevaBCCreate[] = this.articlesSelectionnes().map(sel => ({
      code_article: sel.article.code_article,
      quantite: sel.article.quantite,
      prix_unitaire_ht: sel.prix,
      marque: sel.marque || null,
      affaire: sel.affaire || null,
      tva_pourcent: 20,
      numeros_da: [sel.article.numero_da],
      commentaire: null
    }));

    const request: GenerateCanevaBCRequest = {
      code_fournisseur: this.codeFournisseur().trim().toUpperCase(),
      lignes
    };

    this.bcService.genererCanevaBC(request).subscribe({
      next: (response: EnvoyerBCRPAResponse) => {
        this.saving.set(false);
        if (response.success) {
          this.success.set(`Envoyé au RPA avec succès! (${response.nb_lignes} lignes) - ID: ${response.rpa_request_id}`);
          setTimeout(() => {
            this.resetFormulaire();
          }, 3000);
        } else {
          this.error.set(response.message || 'Erreur lors de l\'envoi au RPA');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.detail || 'Erreur lors de l\'envoi au RPA');
      }
    });
  }

  resetFormulaire(): void {
    this.codeFournisseur.set('');
    this.selectedDA.set('');
    this.daSelections.set([]);
    this.success.set(null);
  }

  retour(): void {
    this.router.navigate(['/bon-commande']);
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }
}
