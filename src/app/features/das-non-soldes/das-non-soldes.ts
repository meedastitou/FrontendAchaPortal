import { Component, OnInit, signal } from '@angular/core';
import { DasNonSoldesEnteteComponent } from './das-non-soldes-entete'; // ou sans .component selon ton nommage
import { FormsModule } from '@angular/forms';
import { DANonSoldee, DasFilters  } from '../../core/models';
import { DasNonSoldesServices } from '../../core/services';


@Component({
  selector: 'app-das-non-soldes',
  imports: [FormsModule, DasNonSoldesEnteteComponent ],
  templateUrl: './das-non-soldes.html',
  styleUrl: './das-non-soldes.scss',
})
export class DasNonSoldes {
  loadingDas = signal(false);
  dasNonSoldees = signal<DANonSoldee[]>([]);

  constructor(private dasNonSoldesServices: DasNonSoldesServices) {}

  onFiltersChange(filters: DasFilters): void {
    this.loadingDas.set(true);
    this.dasNonSoldesServices.getDasNonSoldees(filters).subscribe({
      next: (das) => {
        this.dasNonSoldees.set(das);
        this.loadingDas.set(false);
      },
      error: (err) => {
        console.error('Erreur récupération DA non soldées:', err);
        this.loadingDas.set(false);
      }
    });
  }

  transferringDa = signal<string | null>(null);
  transferredDas = signal<Set<string>>(new Set());

  private daKey(da: DANonSoldee): string {
    return `${da.DA}-${da.Article}`;
  }

  isTransferred(da: DANonSoldee): boolean {
    return this.transferredDas().has(this.daKey(da));
  }

  isTransferring(da: DANonSoldee): boolean {
    return this.transferringDa() === this.daKey(da);
  }

  transfererDA(da: DANonSoldee): void {
    const key = this.daKey(da);
    this.transferringDa.set(key);

    this.dasNonSoldesServices.transfererDA(da).subscribe({
      next: () => {
        this.transferredDas.update(set => new Set(set).add(key));
        this.transferringDa.set(null);
      },
      error: (err) => {
        this.transferringDa.set(null);
        if (err.status === 409) {
          // Deja transferee : on marque quand meme comme transferee
          this.transferredDas.update(set => new Set(set).add(key));
        } else {
          console.error('Erreur transfert DA:', err);
          alert('Erreur lors du transfert de la DA');
        }
      }
    });
  }
}
