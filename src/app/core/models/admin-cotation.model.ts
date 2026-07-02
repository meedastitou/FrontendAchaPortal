// ════════════════════════════════════════════════════════════
// Admin Cotations - Modèles
// ════════════════════════════════════════════════════════════

export interface LigneCotationAdmin {
  id: number;
  rfq_uuid: string;
  numero_rfq: string;
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite_demandee: number;
  unite: string | null;
  marque_souhaitee: string | null;
  created_at: string;

  // Champs de désactivation
  actif: boolean;
  motif_desactivation: string | null;
  date_desactivation: string | null;
  desactive_par: string | null;

  // Infos fournisseur (jointure)
  code_fournisseur: string | null;
  nom_fournisseur: string | null;

  // Stats réponses
  nb_reponses: number;
}

export interface LigneCotationListResponse {
  lignes: LigneCotationAdmin[];
  total: number;
  page: number;
  limit: number;
}

export interface DesactiverLigneRequest {
  motif: string;
}

export interface DesactiverLigneResponse {
  success: boolean;
  message: string;
  ligne: LigneCotationAdmin;
}

export interface ReactiverLigneResponse {
  success: boolean;
  message: string;
  ligne: LigneCotationAdmin;
}

export interface StatsLignesCotation {
  total_lignes: number;
  lignes_actives: number;
  lignes_desactivees: number;
  total_das: number;
  total_articles: number;
}

export interface AdminCotationFilters {
  page?: number;
  limit?: number;
  numero_da?: string;
  code_article?: string;
  actif?: boolean;
  search?: string;
}
