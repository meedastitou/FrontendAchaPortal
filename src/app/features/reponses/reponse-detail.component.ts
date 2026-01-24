import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReponseService } from '../../core/services/reponse.service';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import { ReponseComplete, ReponseDetail } from '../../core/models';
import { ArticleRPABC, ConvertOffreToRPARequest } from '../../core/models/bon-commande.model';

interface ArticleEditable extends ReponseDetail {
  selected: boolean;
  quantite_modifiee: number;
  prix_modifie: number;
  date_modifiee: string | null;
  marque_effective: string | null; // marque_demandee si conforme, sinon marque_proposee
}

@Component({
  selector: 'app-reponse-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './reponse-detail.component.html',
  styleUrl: './reponse-detail.component.scss'
})
export class ReponseDetailComponent implements OnInit {
  reponse = signal<ReponseComplete | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Mode conversion BC
  modeConversion = signal(false);
  articlesEditables = signal<ArticleEditable[]>([]);
  converting = signal(false);
  conversionSuccess = signal(false);
  conversionResult = signal<any>(null);

  // Champs BC
  conditionsPaiement = signal('');
  lieuLivraison = signal('');
  commentaireBC = signal('');

  // Computed
  articlesSelectionnes = computed(() =>
    this.articlesEditables().filter(a => a.selected)
  );

  totalSelectionne = computed(() => {
    return this.articlesSelectionnes().reduce((sum, a) => {
      return sum + (a.quantite_modifiee * a.prix_modifie);
    }, 0);
  });

  // Liste des DAs uniques de la réponse
  dasReponse = computed(() => {
    const rep = this.reponse();
    if (!rep) return [];
    const das = rep.details
      .map(d => d.numero_da)
      .filter((da): da is string => da !== null);
    return [...new Set(das)];
  });

  // Liste des DAs sélectionnées (mode conversion)
  dasSelectionnees = computed(() => {
    const das = this.articlesSelectionnes()
      .map(a => a.numero_da)
      .filter((da): da is string => da !== null);
    return [...new Set(das)];
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reponseService: ReponseService,
    private bcService: BonCommandeService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadReponse(+id);
    }
  }

  loadReponse(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.reponseService.getById(id).subscribe({
      next: (data) => {
        this.reponse.set(data);
        this.initArticlesEditables(data.details);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading reponse:', err);
        this.error.set('Impossible de charger la reponse');
        this.loading.set(false);
      }
    });
  }

  initArticlesEditables(details: ReponseDetail[]): void {
    const editables: ArticleEditable[] = details
      .filter(d => d.prix_unitaire_ht !== null)
      .map(d => ({
        ...d,
        selected: false,
        quantite_modifiee: d.quantite_disponible || 1,
        prix_modifie: d.prix_unitaire_ht || 0,
        date_modifiee: d.date_livraison ? d.date_livraison.split('T')[0] : null,
        // Si marque_conforme = true, utiliser marque_demandee, sinon marque_proposee
        marque_effective: d.marque_conforme ? d.marque_demandee : d.marque_proposee
      }));
    this.articlesEditables.set(editables);
  }

  // Toggle mode conversion
  toggleModeConversion(): void {
    this.modeConversion.set(!this.modeConversion());
    if (!this.modeConversion()) {
      // Reset selections when exiting
      const reset = this.articlesEditables().map(a => ({ ...a, selected: false }));
      this.articlesEditables.set(reset);
    }
  }

  // Selection
  toggleArticle(article: ArticleEditable): void {
    const updated = this.articlesEditables().map(a => {
      if (a.id === article.id) {
        return { ...a, selected: !a.selected };
      }
      return a;
    });
    this.articlesEditables.set(updated);
  }

  selectAll(): void {
    const updated = this.articlesEditables().map(a => ({ ...a, selected: true }));
    this.articlesEditables.set(updated);
  }

  deselectAll(): void {
    const updated = this.articlesEditables().map(a => ({ ...a, selected: false }));
    this.articlesEditables.set(updated);
  }

  // Updates
  updateQuantite(article: ArticleEditable, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    const updated = this.articlesEditables().map(a => {
      if (a.id === article.id) {
        return { ...a, quantite_modifiee: value };
      }
      return a;
    });
    this.articlesEditables.set(updated);
  }

  updatePrix(article: ArticleEditable, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value) || 0;
    const updated = this.articlesEditables().map(a => {
      if (a.id === article.id) {
        return { ...a, prix_modifie: value };
      }
      return a;
    });
    this.articlesEditables.set(updated);
  }

  updateDate(article: ArticleEditable, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const updated = this.articlesEditables().map(a => {
      if (a.id === article.id) {
        return { ...a, date_modifiee: value || null };
      }
      return a;
    });
    this.articlesEditables.set(updated);
  }

  // Conversion
  convertirVersBC(): void {
    const selected = this.articlesSelectionnes();
    if (selected.length === 0) {
      this.error.set('Veuillez sélectionner au moins un article');
      return;
    }

    const rep = this.reponse();
    if (!rep) return;

    this.converting.set(true);
    this.error.set(null);

    const articles: ArticleRPABC[] = selected.map(a => ({
      ligne_detail_id: a.id,
      code_article: a.code_article,
      designation: a.designation_article || null,
      quantite: a.quantite_modifiee,
      unite: null,
      prix_unitaire_ht: a.prix_modifie,
      tva_pourcent: 20,
      date_livraison: a.date_modifiee,
      marque: a.marque_effective || null,
      commentaire: a.commentaire_article || null
    }));

    const request: ConvertOffreToRPARequest = {
      reponse_id: rep.entete.id,
      articles,
      conditions_paiement: this.conditionsPaiement() || undefined,
      lieu_livraison: this.lieuLivraison() || undefined,
      commentaire_bc: this.commentaireBC() || undefined
    };

    this.bcService.convertToRPA(request).subscribe({
      next: (result) => {
        this.converting.set(false);
        if (result.success) {
          this.conversionSuccess.set(true);
          this.conversionResult.set(result);
        } else {
          this.error.set(result.message);
        }
      },
      error: (err) => {
        console.error('Error converting to BC:', err);
        this.error.set('Erreur lors de la conversion');
        this.converting.set(false);
      }
    });
  }

  closeSuccessModal(): void {
    this.conversionSuccess.set(false);
    this.modeConversion.set(false);
    this.conversionResult.set(null);
    // Reset selections
    const reset = this.articlesEditables().map(a => ({ ...a, selected: false }));
    this.articlesEditables.set(reset);
  }

  goBack(): void {
    this.router.navigate(['/reponses']);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatMontant(montant: number | null): string {
    if (montant === null) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  getMontantTotal(): number {
    const rep = this.reponse();
    if (!rep) return 0;

    return rep.details.reduce((sum, d) => {
      const qty = d.quantite_disponible || 1;
      const prix = d.prix_unitaire_ht || 0;
      return sum + (prix * qty);
    }, 0);
  }
}
