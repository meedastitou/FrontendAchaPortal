import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DasFilters } from '../../core/models'; // adapte le chemin

@Component({
  selector: 'app-das-non-soldes-entete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './das-non-soldes-entete.html',
  styleUrl: './das-non-soldes-entete.scss'
})
export class DasNonSoldesEnteteComponent {
  @Output() filtersChange = new EventEmitter<DasFilters>();

  dateDebut: string = this.getDefaultDateDebut();
  famille: string = '';
  article: string = '';
  numeroDa: string = '';

  private getDefaultDateDebut(): string {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }

  onFilterChange(): void {
    this.filtersChange.emit({
      dateDebut: this.dateDebut,
      famille: this.famille || undefined,
      article: this.article || undefined,
      numeroDa: this.numeroDa || undefined
    });
  }

  reset(): void {
    this.dateDebut = this.getDefaultDateDebut();
    this.famille = '';
    this.article = '';
    this.numeroDa = '';
    this.onFilterChange();
  }

  ngOnInit(): void {
    this.onFilterChange(); // charger avec valeurs par défaut au démarrage
  }
}