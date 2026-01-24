import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { BonCommandeService } from '../../core/services/bon-commande.service';
import { BonCommandeResponse } from '../../core/models/bon-commande.model';

@Component({
  selector: 'app-bon-commande-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bon-commande-detail.component.html',
  styleUrl: './bon-commande-detail.component.scss'
})
export class BonCommandeDetailComponent implements OnInit {
  bc = signal<BonCommandeResponse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  validating = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bcService: BonCommandeService
  ) {}

  ngOnInit(): void {
    const numeroBC = this.route.snapshot.params['numeroBC'];
    if (numeroBC) {
      this.loadBC(numeroBC);
    }
  }

  loadBC(numeroBC: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.bcService.getByNumero(numeroBC).subscribe({
      next: (data) => {
        this.bc.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading BC:', err);
        this.error.set('Impossible de charger le bon de commande');
        this.loading.set(false);
      }
    });
  }

  validerBC(): void {
    const currentBC = this.bc();
    if (!currentBC) return;

    this.validating.set(true);
    this.bcService.valider(currentBC.numero_bc).subscribe({
      next: (data) => {
        this.bc.set(data);
        this.validating.set(false);
      },
      error: (err) => {
        console.error('Error validating BC:', err);
        this.error.set('Erreur lors de la validation');
        this.validating.set(false);
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

  // Grouper les lignes par DA
  getLignesParDA(): { numero_da: string; lignes: any[] }[] {
    const currentBC = this.bc();
    if (!currentBC) return [];

    const grouped = new Map<string, any[]>();

    for (const ligne of currentBC.lignes) {
      const da = ligne.numero_da || 'Sans DA';
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
