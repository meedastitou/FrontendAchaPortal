import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import { LigneCanevaBCCreate, GenerateCanevaBCRequest, EnvoyerBCRPAResponse } from '../../core/models/bon-commande.model';

interface ArticleSaisie {
  id: number;
  code_article: string;
  quantite: number;
  prix_unitaire_ht: number;
  marque: string;
  affaire: string;
  tva_pourcent: number;
  numeros_da: string[];
  commentaire: string;
  // Pour l'UI
  da_input: string;
}

@Component({
  selector: 'app-caneva-bc',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './caneva-bc.component.html',
  styleUrl: './caneva-bc.component.scss'
})
export class CanevaBCComponent implements OnInit {
  // Fournisseur (saisie manuelle)
  selectedFournisseur = signal<string>('');

  // Articles (lignes à saisir)
  articles = signal<ArticleSaisie[]>([]);
  nextArticleId = 1;

  // Conditions BC
  lieuLivraison = signal('');
  commentaireBC = signal('');

  // État
  saving = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  // Computed: Nombre total de lignes (avec duplication par DA)
  totalLignes = computed(() => {
    return this.articles().reduce((sum, art) => sum + Math.max(art.numeros_da.length, 1), 0);
  });

  // Computed: Total HT
  totalHT = computed(() => {
    let total = 0;
    for (const art of this.articles()) {
      const nbDa = Math.max(art.numeros_da.length, 1);
      total += art.quantite * art.prix_unitaire_ht * nbDa;
    }
    return total;
  });

  // Computed: Total TVA
  totalTVA = computed(() => {
    let tva = 0;
    for (const art of this.articles()) {
      const nbDa = Math.max(art.numeros_da.length, 1);
      tva += art.quantite * art.prix_unitaire_ht * nbDa * (art.tva_pourcent / 100);
    }
    return tva;
  });

  // Computed: Total TTC
  totalTTC = computed(() => this.totalHT() + this.totalTVA());

  // Computed: Toutes les DA uniques
  dasUniques = computed(() => {
    const das = new Set<string>();
    for (const art of this.articles()) {
      for (const da of art.numeros_da) {
        das.add(da);
      }
    }
    return Array.from(das);
  });

  // Computed: Preview des lignes dupliquées
  lignesPreview = computed(() => {
    const lignes: { code_article: string; numero_da: string; quantite: number; prix_ht: number; montant_ht: number }[] = [];
    for (const art of this.articles()) {
      if (art.numeros_da.length === 0) {
        lignes.push({
          code_article: art.code_article,
          numero_da: '(Aucune DA)',
          quantite: art.quantite,
          prix_ht: art.prix_unitaire_ht,
          montant_ht: art.quantite * art.prix_unitaire_ht
        });
      } else {
        for (const da of art.numeros_da) {
          lignes.push({
            code_article: art.code_article,
            numero_da: da,
            quantite: art.quantite,
            prix_ht: art.prix_unitaire_ht,
            montant_ht: art.quantite * art.prix_unitaire_ht
          });
        }
      }
    }
    return lignes;
  });

  constructor(
    private bcService: BonCommandeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ajouterArticle(); // Ajouter une première ligne vide
  }

  ajouterArticle(): void {
    const newArticle: ArticleSaisie = {
      id: this.nextArticleId++,
      code_article: '',
      quantite: 1,
      prix_unitaire_ht: 0,
      marque: '',
      affaire: '',
      tva_pourcent: 20,
      numeros_da: [],
      commentaire: '',
      da_input: ''
    };
    this.articles.update(arts => [...arts, newArticle]);
  }

  supprimerArticle(id: number): void {
    this.articles.update(arts => arts.filter(a => a.id !== id));
  }

  ajouterDA(article: ArticleSaisie): void {
    const daValue = article.da_input.trim().toUpperCase();
    if (daValue && !article.numeros_da.includes(daValue)) {
      article.numeros_da.push(daValue);
      article.da_input = '';
      // Trigger signal update
      this.articles.update(arts => [...arts]);
    }
  }

  supprimerDA(article: ArticleSaisie, da: string): void {
    article.numeros_da = article.numeros_da.filter(d => d !== da);
    // Trigger signal update
    this.articles.update(arts => [...arts]);
  }

  onDAKeydown(event: KeyboardEvent, article: ArticleSaisie): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.ajouterDA(article);
    }
  }

  validerFormulaire(): boolean {
    // Vérifier le fournisseur
    if (!this.selectedFournisseur()) {
      this.error.set('Veuillez sélectionner un fournisseur');
      return false;
    }

    // Vérifier qu'il y a au moins un article
    if (this.articles().length === 0) {
      this.error.set('Veuillez ajouter au moins un article');
      return false;
    }

    // Vérifier chaque article
    for (const art of this.articles()) {
      if (!art.code_article.trim()) {
        this.error.set('Le code article est obligatoire pour tous les articles');
        return false;
      }
      if (art.quantite <= 0) {
        this.error.set('La quantité doit être supérieure à 0');
        return false;
      }
      if (art.prix_unitaire_ht <= 0) {
        this.error.set('Le prix unitaire doit être supérieur à 0');
        return false;
      }
      if (art.numeros_da.length === 0) {
        this.error.set('Chaque article doit avoir au moins une DA associée');
        return false;
      }
    }

    return true;
  }

  envoyerAuRPA(): void {
    this.error.set(null);
    this.success.set(null);

    if (!this.validerFormulaire()) {
      return;
    }

    this.saving.set(true);

    // Construire la requête
    const lignes: LigneCanevaBCCreate[] = this.articles().map(art => ({
      code_article: art.code_article.trim().toUpperCase(),
      quantite: art.quantite,
      prix_unitaire_ht: art.prix_unitaire_ht,
      marque: art.marque.trim() || null,
      affaire: art.affaire.trim() || null,
      tva_pourcent: art.tva_pourcent,
      numeros_da: art.numeros_da,
      commentaire: art.commentaire.trim() || null
    }));

    const request: GenerateCanevaBCRequest = {
      code_fournisseur: this.selectedFournisseur().trim().toUpperCase(),
      lignes,
      lieu_livraison: this.lieuLivraison() || undefined,
      commentaire: this.commentaireBC() || undefined
    };

    this.bcService.genererCanevaBC(request).subscribe({
      next: (response: EnvoyerBCRPAResponse) => {
        this.saving.set(false);
        if (response.success) {
          this.success.set(`Envoyé au RPA avec succès! (${response.nb_lignes} lignes) - ID: ${response.rpa_request_id}`);
          // Réinitialiser le formulaire après 3 secondes
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
        console.error('Error sending to RPA:', err);
      }
    });
  }

  resetFormulaire(): void {
    this.articles.set([]);
    this.selectedFournisseur.set('');
    this.lieuLivraison.set('');
    this.commentaireBC.set('');
    this.success.set(null);
    this.nextArticleId = 1;
    this.ajouterArticle();
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

  // Méthode pour forcer la mise à jour du signal articles
  refreshArticles(): void {
    this.articles.update(arts => [...arts]);
  }
}
