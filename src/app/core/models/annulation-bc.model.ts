// ════════════════════════════════════════════════════════════
// Annulation BC - Modeles
// ════════════════════════════════════════════════════════════

export type StatutAnnulation = 'en_attente' | 'en_cours' | 'validee' | 'refusee';

export interface AnnulationBC {
  id: number;
  numero_commande: string;
  motif_annulation: string;
  demande_par: string;
  statut: StatutAnnulation;
  numero_abc: string | null;
  code_tier: string | null;
  email_fournisseur: string | null;
  created_at: string;
}

export interface AnnulationBCCreate {
  numero_commande: string;
  motif_annulation: string;
}

export interface AnnulationBCResponse {
  success: boolean;
  message: string;
  annulation: AnnulationBC;
}

export interface AnnulationBCListResponse {
  annulations: AnnulationBC[];
  total: number;
  page: number;
  limit: number;
}

export interface AnnulationBCFilters {
  page?: number;
  limit?: number;
  statut?: StatutAnnulation;
  numero_commande?: string;
}
