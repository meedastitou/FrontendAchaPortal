import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import {
  FournisseurDisponibleBC,
  BonCommandeResponse,
  BCX3Response
} from '../../core/models/bon-commande.model';

@Component({
  selector: 'app-bon-commande-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bon-commande-list.component.html',
  styleUrl: './bon-commande-list.component.scss'
})
export class BonCommandeListComponent implements OnInit {
  // Onglet actif
  activeTab = signal<'nouveau' | 'existant' | 'x3'>('nouveau');

  // Fournisseurs disponibles pour nouveau BC
  fournisseursDisponibles = signal<FournisseurDisponibleBC[]>([]);
  loadingFournisseurs = signal(true);

  // Liste des BC existants
  bonsCommande = signal<BonCommandeResponse[]>([]);
  loadingBC = signal(true);

  // Pagination BC
  page = 1;
  limit = 20;
  totalBC = signal(0);

  // BC X3 RPA
  bcX3List = signal<BCX3Response[]>([]);
  loadingBCX3 = signal(false);
  totalBCX3 = signal(0);
  selectedBCX3 = signal<BCX3Response | null>(null);

  error = signal<string | null>(null);

  // Pour Math dans le template
  Math = Math;

  constructor(
    private bcService: BonCommandeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFournisseursDisponibles();
    this.loadBonsCommande();
  }

  setActiveTab(tab: 'nouveau' | 'existant' | 'x3'): void {
    this.activeTab.set(tab);
    if (tab === 'x3' && this.bcX3List().length === 0) {
      this.loadBCX3();
    }
  }

  loadFournisseursDisponibles(): void {
    this.loadingFournisseurs.set(true);
    this.bcService.getFournisseursDisponibles().subscribe({
      next: (data) => {
        this.fournisseursDisponibles.set(data.fournisseurs);
        this.loadingFournisseurs.set(false);
      },
      error: (err) => {
        console.error('Error loading fournisseurs:', err);
        this.loadingFournisseurs.set(false);
      }
    });
  }

  loadBonsCommande(): void {
    this.loadingBC.set(true);
    this.bcService.getAll(this.page, this.limit).subscribe({
      next: (data) => {
        this.bonsCommande.set(data.bons_commande);
        this.totalBC.set(data.total);
        this.loadingBC.set(false);
      },
      error: (err) => {
        console.error('Error loading BC:', err);
        this.loadingBC.set(false);
      }
    });
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadBonsCommande();
  }

  preparerBC(codeFournisseur: string): void {
    this.router.navigate(['/bon-commande/preparer', codeFournisseur]);
  }

  voirBC(numeroBC: string): void {
    this.router.navigate(['/bon-commande', numeroBC]);
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montant);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatutClass(statut: string): string {
    const classes: Record<string, string> = {
      'brouillon': 'badge-warning',
      'valide': 'badge-success',
      'envoye': 'badge-info',
      'livre': 'badge-primary',
      'annule': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      'brouillon': 'Brouillon',
      'valide': 'Validé',
      'envoye': 'Envoyé',
      'livre': 'Livré',
      'annule': 'Annulé'
    };
    return labels[statut] || statut;
  }

  // ────────────────────────────────────────────
  // BC X3 RPA
  // ────────────────────────────────────────────

  loadBCX3(): void {
    this.loadingBCX3.set(true);
    this.bcService.getBCX3RPA().subscribe({
      next: (data) => {
        this.bcX3List.set(data.bcs);
        this.totalBCX3.set(data.total);
        this.loadingBCX3.set(false);
      },
      error: (err) => {
        console.error('Error loading BC X3:', err);
        this.loadingBCX3.set(false);
      }
    });
  }

  selectBCX3(bc: BCX3Response): void {
    if (this.selectedBCX3()?.numero_commande === bc.numero_commande) {
      this.selectedBCX3.set(null);
    } else {
      this.selectedBCX3.set(bc);
    }
  }

  getTotalMontantX3(): number {
    return this.bcX3List().reduce((sum, bc) => sum + (bc.total_commande_ht || 0), 0);
  }
}
