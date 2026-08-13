import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AnalyseService } from '../../core/services/analyse.service';
import {
  AnalyseDashboardResponse,
  FunnelStats,
  BlocageStats,
  ArticleNonSigne,
  ArticlePrixSuperieur,
  ArticleMarqueDifferente,
  ArticleMarqueInexistante,
  ArticlePrixOkMarqueInex,
  ArticleSansReponse,
  TypeBlocage,
  BlocageFilters,
  DANonSoldee,
  RFQSansReponseAnalyse,
  RFQAvecReponseAnalyse
} from '../../core/models/analyse.model';

@Component({
  selector: 'app-analyse-blocages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './analyse-blocages.component.html',
  styleUrl: './analyse-blocages.component.scss'
})
export class AnalyseBlocagesComponent implements OnInit {
  // Dashboard principal
  loading = signal(true);
  error = signal<string | null>(null);
  dashboard = signal<AnalyseDashboardResponse | null>(null);

  // Onglet sélectionné
  selectedTab = signal<TypeBlocage>('non-signes');

  // Listes par catégorie
  articlesNonSignes = signal<ArticleNonSigne[]>([]);
  articlesPrixSup = signal<ArticlePrixSuperieur[]>([]);
  articlesMarqueDiff = signal<ArticleMarqueDifferente[]>([]);
  articlesMarqueInex = signal<ArticleMarqueInexistante[]>([]);
  articlesSansReponse = signal<ArticleSansReponse[]>([]);

  // RFQ DA Non Soldées
  daSansRfq = signal<DANonSoldee[]>([]);
  totalDaSansRfq = signal(0);
  rfqsSansReponse = signal<RFQSansReponseAnalyse[]>([]);
  rfqsAvecReponse = signal<RFQAvecReponseAnalyse[]>([]);
  totalRfqSansReponse = signal(0);
  totalRfqAvecReponse = signal(0);
  rfqLoading = signal(false);

  // Pagination et filtres
  listLoading = signal(false);
  currentPage = signal(1);
  totalItems = signal(0);
  pageSize = 20;

  // Filtres
  filterNumeroDA = '';
  filterCodeArticle = '';

  constructor(private analyseService: AnalyseService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.analyseService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
        // Charger la première liste
        this.loadListForTab(this.selectedTab());
        // Charger aussi les RFQ DA non soldées
        this.loadRFQDANonSolde();
      },
      error: (err) => {
        console.error('Error loading analyse dashboard:', err);
        this.error.set('Impossible de charger les données d\'analyse');
        this.loading.set(false);
      }
    });
  }

  loadRFQDANonSolde(): void {
    this.rfqLoading.set(true);
    this.analyseService.getDANonSoldeAnalyse().subscribe({
      next: (data) => {
        this.daSansRfq.set(data.da_sans_rfq);
        this.totalDaSansRfq.set(data.total_sans_rfq);
        this.rfqsSansReponse.set(data.rfqs_sans_reponse);
        this.rfqsAvecReponse.set(data.rfqs_avec_reponse);
        this.totalRfqSansReponse.set(data.total_sans_reponse);
        this.totalRfqAvecReponse.set(data.total_avec_reponse);
        this.rfqLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading RFQ DA non solde:', err);
        this.rfqLoading.set(false);
      }
    });
  }

  selectTab(tab: TypeBlocage): void {
    this.selectedTab.set(tab);
    this.currentPage.set(1);
    this.filterNumeroDA = '';
    this.filterCodeArticle = '';
    this.loadListForTab(tab);
  }

  loadListForTab(tab: TypeBlocage): void {
    const filters: BlocageFilters = {
      page: this.currentPage(),
      limit: this.pageSize,
      numero_da: this.filterNumeroDA || undefined,
      code_article: this.filterCodeArticle || undefined
    };

    this.listLoading.set(true);

    switch (tab) {
      case 'non-signes':
        this.analyseService.getArticlesNonSignes(filters).subscribe({
          next: (data) => {
            this.articlesNonSignes.set(data.items);
            this.totalItems.set(data.total);
            this.listLoading.set(false);
          },
          error: () => this.listLoading.set(false)
        });
        break;

      case 'prix-superieur':
        this.analyseService.getArticlesPrixSuperieur(filters).subscribe({
          next: (data) => {
            this.articlesPrixSup.set(data.items);
            this.totalItems.set(data.total);
            this.listLoading.set(false);
          },
          error: () => this.listLoading.set(false)
        });
        break;

      case 'marque-differente':
        this.analyseService.getArticlesMarqueDifferente(filters).subscribe({
          next: (data) => {
            this.articlesMarqueDiff.set(data.items);
            this.totalItems.set(data.total);
            this.listLoading.set(false);
          },
          error: () => this.listLoading.set(false)
        });
        break;

      case 'marque-inexistante':
        this.analyseService.getArticlesMarqueInexistante(filters).subscribe({
          next: (data) => {
            this.articlesMarqueInex.set(data.items);
            this.totalItems.set(data.total);
            this.listLoading.set(false);
          },
          error: () => this.listLoading.set(false)
        });
        break;

      case 'sans-reponse':
        this.analyseService.getArticlesSansReponse(filters).subscribe({
          next: (data) => {
            this.articlesSansReponse.set(data.items);
            this.totalItems.set(data.total);
            this.listLoading.set(false);
          },
          error: () => this.listLoading.set(false)
        });
        break;

      case 'da-sans-rfq':
      case 'rfq-sans-reponse':
      case 'rfq-avec-reponse':
        // Ces onglets utilisent rfqLoading, pas listLoading
        this.listLoading.set(false);
        // Recharger les données RFQ si pas encore chargées
        if (this.daSansRfq().length === 0 && this.rfqsSansReponse().length === 0 && this.rfqsAvecReponse().length === 0) {
          this.loadRFQDANonSolde();
        }
        break;
    }
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadListForTab(this.selectedTab());
  }

  clearFilters(): void {
    this.filterNumeroDA = '';
    this.filterCodeArticle = '';
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadListForTab(this.selectedTab());
  }

  totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize);
  }

  // Helpers d'affichage
  formatMontant(montant: number | null): string {
    if (montant === null || montant === undefined) return '-';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  formatPourcent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  }

  // Calcul des barres du funnel
  getFunnelWidth(value: number, total: number): string {
    if (total === 0) return '0%';
    return `${Math.max(10, (value / total) * 100)}%`;
  }

  // Couleur selon l'écart de prix
  getEcartClass(ecart: number): string {
    if (ecart >= 50) return 'ecart-critical';
    if (ecart >= 20) return 'ecart-warning';
    return 'ecart-low';
  }

  // Formater le delai de reponse
  formatDelai(heures: number): string {
    if (heures < 24) {
      return `${heures}h`;
    }
    const jours = Math.floor(heures / 24);
    const reste = heures % 24;
    return reste > 0 ? `${jours}j ${reste}h` : `${jours}j`;
  }

  // Formater le statut RFQ
  formatStatut(statut: string): string {
    const map: Record<string, string> = {
      envoye: 'Envoye',
      vu: 'Vu',
      repondu: 'Repondu',
      rejete: 'Rejete',
      expire: 'Expire',
      relance_1: 'Relance 1',
      relance_2: 'Relance 2',
      relance_3: 'Relance 3'
    };
    return map[statut] || statut;
  }

  // Export (placeholder)
  exportToExcel(): void {
    alert('Export Excel en cours de développement');
  }
}
