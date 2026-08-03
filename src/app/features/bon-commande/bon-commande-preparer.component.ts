import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import {
  LigneDisponibleBC,
  LignesDisponiblesResponse,
  GenerateBCRequest,
  LigneBCCreate
} from '../../core/models/bon-commande.model';

interface LigneEditable extends LigneDisponibleBC {
  quantite_a_commander: number;
  selected: boolean;
}

@Component({
  selector: 'app-bon-commande-preparer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bon-commande-preparer.component.html',
  styleUrl: './bon-commande-preparer.component.scss'
})
export class BonCommandePreparerComponent implements OnInit {
  codeFournisseur = signal<string>('');
  nomFournisseur = signal<string>('');
  emailFournisseur = signal<string | null>(null);

  lignes = signal<LigneEditable[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  generating = signal(false);

  // Champs BC
  conditionsPaiement = signal<string>('');
  lieuLivraison = signal<string>('');
  commentaire = signal<string>('');

  // Computed values
  lignesSelectionnees = computed(() => this.lignes().filter(l => l.selected));

  totalHT = computed(() => {
    return this.lignesSelectionnees().reduce((sum, l) => {
      return sum + (l.quantite_a_commander * l.prix_unitaire_ht);
    }, 0);
  });

  totalTVA = computed(() => this.totalHT() * 0.20);
  totalTTC = computed(() => this.totalHT() + this.totalTVA());

  dasIncluses = computed(() => {
    const das = new Set(this.lignesSelectionnees().map(l => l.numero_da));
    return Array.from(das);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bcService: BonCommandeService
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.params['codeFournisseur'];
    if (code) {
      this.codeFournisseur.set(code);
      this.loadLignes(code);
    }
  }

  loadLignes(codeFournisseur: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.bcService.getLignesFournisseur(codeFournisseur).subscribe({
      next: (data) => {
        this.nomFournisseur.set(data.nom_fournisseur);
        this.emailFournisseur.set(data.email_fournisseur);

        // Convertir en lignes éditables
        const editables: LigneEditable[] = data.lignes.map(l => ({
          ...l,
          quantite_a_commander: l.quantite_disponible,
          selected: true
        }));
        this.lignes.set(editables);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading lignes:', err);
        this.error.set('Impossible de charger les lignes');
        this.loading.set(false);
      }
    });
  }

  toggleSelection(ligne: LigneEditable): void {
    const updated = this.lignes().map(l => {
      if (l.ligne_id === ligne.ligne_id) {
        return { ...l, selected: !l.selected };
      }
      return l;
    });
    this.lignes.set(updated);
  }

  selectAll(): void {
    const updated = this.lignes().map(l => ({ ...l, selected: true }));
    this.lignes.set(updated);
  }

  deselectAll(): void {
    const updated = this.lignes().map(l => ({ ...l, selected: false }));
    this.lignes.set(updated);
  }

  updateQuantite(ligne: LigneEditable, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value) || 0;

    const updated = this.lignes().map(l => {
      if (l.ligne_id === ligne.ligne_id) {
        return { ...l, quantite_a_commander: Math.min(value, l.quantite_disponible) };
      }
      return l;
    });
    this.lignes.set(updated);
  }

  genererBC(): void {
    const selected = this.lignesSelectionnees();
    if (selected.length === 0) {
      this.error.set('Veuillez sélectionner au moins une ligne');
      return;
    }

    this.generating.set(true);
    this.error.set(null);

    const lignesBC: LigneBCCreate[] = selected.map(l => ({
      ligne_id: l.ligne_id,
      reponse_id: l.reponse_id,
      code_article: l.code_article,
      designation: l.designation,
      quantite: l.quantite_a_commander,
      prix_unitaire_ht: l.prix_unitaire_ht,
      tva_pourcent: l.tva_pourcent,
      date_livraison_prevue: l.date_livraison_prevue,
      commentaire: null
    }));

    const request: GenerateBCRequest = {
      code_fournisseur: this.codeFournisseur(),
      lignes: lignesBC,
      conditions_paiement: this.conditionsPaiement() || undefined,
      lieu_livraison: this.lieuLivraison() || undefined,
      commentaire: this.commentaire() || undefined
    };

    this.bcService.genererBC(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/bon-commande', response.numero_bc]);
        } else {
          this.error.set(response.message);
          this.generating.set(false);
        }
      },
      error: (err) => {
        console.error('Error generating BC:', err);
        this.error.set('Erreur lors de la génération du BC');
        this.generating.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bon-commande']);
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  // Grouper les lignes par DA
  getLignesParDA(): { numero_da: string; lignes: LigneEditable[] }[] {
    const grouped = new Map<string, LigneEditable[]>();

    for (const ligne of this.lignes()) {
      const da = ligne.numero_da;
      if (!grouped.has(da)) {
        grouped.set(da, []);
      }
      grouped.get(da)!.push(ligne);
    }

    return Array.from(grouped.entries()).map(([numero_da, lignes]) => ({
      numero_da,
      lignes
    }));
  }
}
