export type StatutRFQ = 'envoye' | 'vu' | 'repondu' | 'rejete' | 'expire' | 'relance_1' | 'relance_2' | 'relance_3';

export interface LigneCotation {
  id: number;
  rfq_uuid: string;
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite_demandee: number;
  unite: string | null;
  marque_souhaitee: string | null;
  created_at: string;
}

export interface RFQ {
  id: number;
  uuid: string;
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur?: string;
  email_fournisseur?: string;
  date_envoi: string;
  date_limite_reponse: string | null;
  statut: StatutRFQ;
  nb_relances: number;
  date_derniere_relance: string | null;
  date_ouverture_email: string | null;
  date_clic_formulaire: string | null;
  date_reponse: string | null;
  created_at: string;
  lignes: LigneCotation[];
}

export interface RFQDetail extends RFQ {
  jours_depuis_envoi: number;
  delai_reponse_heures: number | null;
  nb_articles: number;
}

export interface RFQListResponse {
  rfqs: RFQ[];
  total: number;
  page: number;
  limit: number;
}

export interface RFQFilters {
  statut?: StatutRFQ;
  code_fournisseur?: string;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  code_article?: string;
  numero_da?: string;
}
