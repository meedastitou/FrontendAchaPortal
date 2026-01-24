import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import {
  FournisseurDisponibleBC,
  BonCommandeResponse
} from '../../core/models/bon-commande.model';

@Component({
  selector: 'app-bon-commande-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bon-commande-list.component.html',
  styleUrl: './bon-commande-list.component.scss'
})
export class BonCommandeListComponent implements OnInit {
  // Onglet actif
  activeTab = signal<'nouveau' | 'existant'>('nouveau');

  // Fournisseurs disponibles pour nouveau BC
  fournisseursDisponibles = signal<FournisseurDisponibleBC[]>([]);
  loadingFournisseurs = signal(true);

  // Liste des BC existants
  bonsCommande = signal<BonCommandeResponse[]>([]);
  loadingBC = signal(true);

  error = signal<string | null>(null);

  constructor(
    private bcService: BonCommandeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFournisseursDisponibles();
    this.loadBonsCommande();
  }

  setActiveTab(tab: 'nouveau' | 'existant'): void {
    this.activeTab.set(tab);
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
    this.bcService.getAll(1, 50).subscribe({
      next: (data) => {
        this.bonsCommande.set(data.bons_commande);
        this.loadingBC.set(false);
      },
      error: (err) => {
        console.error('Error loading BC:', err);
        this.loadingBC.set(false);
      }
    });
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
}
