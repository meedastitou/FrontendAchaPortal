import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { RFQService } from '../../core/services/rfq.service';
import { ReponseService } from '../../core/services/reponse.service';
import { RFQDetail, ReponseComplete, ReponseDetail } from '../../core/models';

@Component({
  selector: 'app-rfq-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rfq-detail.component.html',
  styleUrl: './rfq-detail.component.scss'
})
export class RFQDetailComponent implements OnInit {
  rfq = signal<RFQDetail | null>(null);
  reponse = signal<ReponseComplete | null>(null);
  loading = signal(true);
  loadingReponse = signal(false);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rfqService: RFQService,
    private reponseService: ReponseService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadRFQ(+id);
    }
  }

  loadRFQ(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.rfqService.getById(id).subscribe({
      next: (data) => {
        this.rfq.set(data);
        this.loading.set(false);

        // Si la RFQ a une réponse, charger les détails
        if (data.statut === 'repondu' && data.uuid) {
          this.loadReponse(data.uuid);
        }
      },
      error: (err) => {
        console.error('Error loading RFQ:', err);
        this.error.set('Impossible de charger la RFQ');
        this.loading.set(false);
      }
    });
  }

  loadReponse(rfqUuid: string): void {
    this.loadingReponse.set(true);

    this.reponseService.getByRFQ(rfqUuid).subscribe({
      next: (data) => {
        this.reponse.set(data);
        this.loadingReponse.set(false);
      },
      error: (err) => {
        console.error('Error loading response:', err);
        this.loadingReponse.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/rfq']);
  }

  formatStatut(statut: string): string {
    const map: Record<string, string> = {
      envoye: 'Envoyee',
      vu: 'Vue',
      repondu: 'Repondue',
      rejete: 'Rejetee',
      expire: 'Expiree',
      relance_1: 'Relance 1',
      relance_2: 'Relance 2',
      relance_3: 'Relance 3'
    };
    return map[statut] || statut;
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      envoye: 'blue',
      vu: 'purple',
      repondu: 'green',
      rejete: 'red',
      expire: 'gray',
      relance_1: 'orange',
      relance_2: 'orange',
      relance_3: 'red'
    };
    return map[statut] || 'gray';
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
      const ligne = this.rfq()?.lignes.find(l => l.id === d.ligne_cotation_id);
      const qty = ligne?.quantite_demandee || d.quantite_disponible || 0;
      const prix = d.prix_unitaire_ht || 0;
      return sum + (prix * qty);
    }, 0);
  }

  getDetailForLigne(ligneCotationId: number): ReponseDetail | null {
    const rep = this.reponse();
    if (!rep) return null;
    return rep.details.find(d => d.ligne_cotation_id === ligneCotationId) || null;
  }
}
