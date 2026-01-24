/**
 * ════════════════════════════════════════════════════════════
 * MODELS - Bon de Commande (Multi-DA par Fournisseur)
 * ════════════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────────────────
// DA Disponible pour un fournisseur
// ──────────────────────────────────────────────────────────

export interface DADisponible {
  numero_da: string;
  numero_rfq: string;
  reponse_id: number;
  date_reponse: string | null;
  nb_lignes: number;
  montant_total_ht: number;
}

// ──────────────────────────────────────────────────────────
// Fournisseur disponible pour créer un BC
// ──────────────────────────────────────────────────────────

export interface FournisseurDisponibleBC {
  code_fournisseur: string;
  nom_fournisseur: string;
  email: string | null;
  telephone: string | null;
  nb_da_disponibles: number;
  nb_lignes_total: number;
  montant_total_ht: number;
  das_disponibles: DADisponible[];
}

export interface FournisseursDisponiblesResponse {
  fournisseurs: FournisseurDisponibleBC[];
  total: number;
}

// ──────────────────────────────────────────────────────────
// Ligne disponible pour BC
// ──────────────────────────────────────────────────────────

export interface LigneDisponibleBC {
  ligne_id: number;
  reponse_id: number;
  numero_da: string;
  numero_rfq: string;
  code_article: string;
  designation: string | null;
  quantite_demandee: number;
  quantite_disponible: number;
  unite: string | null;
  prix_unitaire_ht: number;
  montant_ligne_ht: number;
  tva_pourcent: number;
  montant_ligne_ttc: number;
  delai_livraison_jours: number | null;
  date_livraison_prevue: string | null;
  marque_proposee: string | null;
  prix_historique_moyen: number | null;
  ecart_prix_pourcent: number | null;
  selectionne: boolean;
}

export interface LignesDisponiblesResponse {
  code_fournisseur: string;
  nom_fournisseur: string;
  email_fournisseur: string | null;
  lignes: LigneDisponibleBC[];
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
  nb_lignes: number;
  nb_da: number;
}

// ──────────────────────────────────────────────────────────
// Ligne pour création de BC
// ──────────────────────────────────────────────────────────

export interface LigneBCCreate {
  ligne_id: number;
  reponse_id: number;
  code_article: string;
  designation: string | null;
  quantite: number;
  prix_unitaire_ht: number;
  tva_pourcent: number;
  date_livraison_prevue: string | null;
  commentaire: string | null;
}

// ──────────────────────────────────────────────────────────
// Requête de génération BC
// ──────────────────────────────────────────────────────────

export interface GenerateBCRequest {
  code_fournisseur: string;
  lignes: LigneBCCreate[];
  conditions_paiement?: string;
  lieu_livraison?: string;
  commentaire?: string;
}

export interface GenerateBCResponse {
  success: boolean;
  numero_bc: string | null;
  message: string;
  montant_total_ht: number | null;
  montant_total_ttc: number | null;
  code_fournisseur: string | null;
  nom_fournisseur: string | null;
  nb_lignes: number | null;
  das_incluses: string[] | null;
}

// ──────────────────────────────────────────────────────────
// Ligne de BC (lecture)
// ──────────────────────────────────────────────────────────

export interface LigneBCResponse {
  id: number;
  numero_bc: string;
  ligne_source_id: number | null;
  reponse_id: number | null;
  numero_da: string | null;
  numero_rfq: string | null;
  code_article: string;
  designation: string | null;
  quantite: number;
  unite: string | null;
  prix_unitaire_ht: number;
  montant_ligne_ht: number;
  tva_pourcent: number;
  montant_ligne_ttc: number;
  date_livraison_prevue: string | null;
  commentaire: string | null;
}

// ──────────────────────────────────────────────────────────
// Bon de Commande (lecture)
// ──────────────────────────────────────────────────────────

export type StatutBonCommande = 'brouillon' | 'valide' | 'envoye' | 'livre' | 'annule';

export interface BonCommandeResponse {
  id: number;
  numero_bc: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  date_creation: string;
  date_validation: string | null;
  validee_par: string | null;
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
  devise: string;
  statut: StatutBonCommande;
  conditions_paiement: string | null;
  lieu_livraison: string | null;
  commentaire: string | null;
  lignes: LigneBCResponse[];
  das_incluses: string[];
  nb_lignes: number;
}

export interface BCListResponse {
  bons_commande: BonCommandeResponse[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Conversion Offre vers BC (RPA Sage X3)
// ──────────────────────────────────────────────────────────

export interface ArticleRPABC {
  ligne_detail_id: number;
  code_article: string;
  designation: string | null;
  quantite: number;
  unite: string | null;
  prix_unitaire_ht: number;
  tva_pourcent: number;
  date_livraison: string | null;
  marque: string | null;
  commentaire: string | null;
}

export interface ConvertOffreToRPARequest {
  reponse_id: number;
  articles: ArticleRPABC[];
  conditions_paiement?: string;
  lieu_livraison?: string;
  commentaire_bc?: string;
}

export interface ConvertOffreToRPAResponse {
  success: boolean;
  message: string;
  rpa_request_id: string | null;
  code_fournisseur: string | null;
  nom_fournisseur: string | null;
  nb_articles: number | null;
  montant_total_ht: number | null;
  payload_rpa: any | null;
}
