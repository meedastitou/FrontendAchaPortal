import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReponseService } from '../../core/services/reponse.service';
import { ArticleDashboard, ComparaisonDashboardResponse } from '../../core/models';

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

  dashboard = signal<ComparaisonDashboardResponse | null>(null);
  searchTerm = signal('');
  selectedArticle = signal<ArticleDashboard | null>(null);

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

  constructor(private reponseService: ReponseService) {}

  ngOnInit(): void {
    this.loadDashboard();
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
