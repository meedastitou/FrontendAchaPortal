export type StatutFournisseur = 'actif' | 'inactif' | 'suspendu';

export interface Fournisseur {
  id: number;
  code_fournisseur: string;
  nom_fournisseur: string;
  email: string | null;
  telephone: string | null;
  fax: string | null;
  adresse: string | null;
  pays: string | null;
  ville: string | null;
  blacklist: boolean;
  motif_blacklist: string | null;
  date_blacklist: string | null;
  statut: StatutFournisseur;
  note_performance: number | null;
  taux_reponse: number | null;
  nb_total_rfq: number;
  nb_reponses: number;
  created_at: string;
  updated_at: string;
}

export interface FournisseurCreate {
  code_fournisseur: string;
  nom_fournisseur: string;
  email?: string;
  telephone?: string;
  fax?: string;
  adresse?: string;
  pays?: string;
  ville?: string;
}

export interface FournisseurUpdate {
  nom_fournisseur?: string;
  email?: string;
  telephone?: string;
  fax?: string;
  adresse?: string;
  pays?: string;
  ville?: string;
  statut?: StatutFournisseur;
}

export interface FournisseurListResponse {
  fournisseurs: Fournisseur[];
  total: number;
  page: number;
  limit: number;
}

export interface BlacklistRequest {
  motif: string;
}
