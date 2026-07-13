/**
 * ════════════════════════════════════════════════════════════
 * MODELS - Synchronisation statuts DA avec Sage X3
 * ════════════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────────────────

export type TypeSync = 'manuel' | 'auto' | 'planifie';
export type StatutSync = 'succes' | 'partiel' | 'echec';
export type StatutX3Combine = 'SOLDE' | 'EN_ATTENTE_SIGNATURE' | 'ACTIVE';

// ──────────────────────────────────────────────────────────
// Requête de synchronisation
// ──────────────────────────────────────────────────────────

export interface SyncX3Request {
  type_sync?: TypeSync;
  numero_da?: string;
  limit?: number;
  force_update?: boolean;
}

// ──────────────────────────────────────────────────────────
// Résultats de synchronisation
// ──────────────────────────────────────────────────────────

export interface DAStatusX3 {
  numero_da: string;
  code_article?: string;
  x3_signe: boolean;
  x3_niveau_signature: number;
  x3_solde: boolean;
  statut_combine: StatutX3Combine;
  signature_changee: boolean;
  solde_change: boolean;
}

export interface SyncX3Response {
  success: boolean;
  statut: StatutSync;
  message: string;
  date_sync: string;
  duree_ms: number;
  nb_da_verifiees: number;
  nb_da_mises_a_jour: number;
  nb_nouvelles_signees: number;
  nb_nouvelles_soldees: number;
  changements: DAStatusX3[];
  erreurs: string[];
  log_id?: number;
}

// ──────────────────────────────────────────────────────────
// Stats X3 pour dashboard
// ──────────────────────────────────────────────────────────

export interface StatsX3 {
  total_da: number;
  nb_signees: number;
  nb_non_signees: number;
  nb_soldees: number;
  nb_non_soldees: number;
  nb_signees_non_soldees: number;
  nb_en_attente_signature: number;
  derniere_sync?: string;
  nb_jamais_sync: number;
}

// ──────────────────────────────────────────────────────────
// Liste des DA avec statut X3
// ──────────────────────────────────────────────────────────

export interface DAAvecStatutX3 {
  id: number;
  numero_da: string;
  code_article: string;
  designation_article?: string;
  quantite: number;
  unite?: string;
  marque_souhaitee?: string;
  date_creation_da: string;
  date_besoin?: string;
  statut_portail: string;
  priorite: string;
  x3_signe: boolean;
  x3_niveau_signature: number;
  libelle_signature: string;
  x3_solde: boolean;
  libelle_solde: string;
  statut_x3_combine: StatutX3Combine;
  x3_derniere_sync?: string;
}

export interface DAListX3Response {
  items: DAAvecStatutX3[];
  total: number;
  page: number;
  limit: number;
  stats?: StatsX3;
}

// ──────────────────────────────────────────────────────────
// Historique des syncs
// ──────────────────────────────────────────────────────────

export interface LogSyncX3 {
  id: number;
  date_sync: string;
  type_sync: TypeSync;
  nb_da_verifiees: number;
  nb_da_mises_a_jour: number;
  nb_nouvelles_signees: number;
  nb_nouvelles_soldees: number;
  statut: StatutSync;
  message_erreur?: string;
  duree_ms?: number;
  execute_par: string;
}

export interface LogSyncX3ListResponse {
  logs: LogSyncX3[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Filtres pour la liste
// ──────────────────────────────────────────────────────────

export interface DAListX3Filters {
  page?: number;
  limit?: number;
  x3_signe?: boolean;
  x3_solde?: boolean;
  statut_x3?: StatutX3Combine;
  numero_da?: string;
  code_article?: string;
  include_stats?: boolean;
}

// ──────────────────────────────────────────────────────────
// Alertes et Analyses
// ──────────────────────────────────────────────────────────

export interface StatsAlertesX3 {
  nb_reponses_da_non_signees: number;
  nb_offres_prix_superieur: number;
  montant_ecart_total: number;
  nb_offres_marque_differente: number;
  nb_da_non_soldees_x3: number;
}

export interface ReponseDANonSignee {
  numero_da: string;
  code_article: string;
  designation_article?: string;
  quantite_demandee: number;
  marque_souhaitee?: string;
  reponse_id: number;
  code_fournisseur: string;
  nom_fournisseur?: string;
  prix_unitaire: number;
  quantite_disponible: number;
  delai_livraison?: number;
  date_reponse: string;
  x3_niveau_signature: number;
  libelle_signature: string;
}

export interface ReponseDANonSigneeListResponse {
  items: ReponseDANonSignee[];
  total: number;
  page: number;
  limit: number;
}

export interface OffrePrixSuperieurTarif {
  code_article: string;
  designation_article?: string;
  numero_da: string;
  tarif_x3: number;
  reponse_id: number;
  code_fournisseur: string;
  nom_fournisseur?: string;
  prix_propose: number;
  quantite_disponible: number;
  date_reponse: string;
  ecart_pourcent: number;
  ecart_montant: number;
}

export interface OffrePrixSuperieurTarifListResponse {
  items: OffrePrixSuperieurTarif[];
  total: number;
  page: number;
  limit: number;
  nb_total_offres: number;
  montant_ecart_total: number;
}

export interface OffreMarqueDifferente {
  code_article: string;
  designation_article?: string;
  numero_da: string;
  marque_souhaitee?: string;
  reponse_id: number;
  code_fournisseur: string;
  nom_fournisseur?: string;
  marque_proposee?: string;
  prix_propose: number;
  quantite_disponible: number;
  date_reponse: string;
  marque_existe_x3: boolean;
  marques_disponibles_x3: string[];
}

export interface OffreMarqueDifferenteListResponse {
  items: OffreMarqueDifferente[];
  total: number;
  page: number;
  limit: number;
}

export interface DANonSoldeeX3 {
  numero_da: string;
  code_article: string;
  designation_article?: string;
  quantite: number;
  marque?: string;
  unite?: string;
  famille?: string;
  date_da?: string;
  existe_portail: boolean;
  nb_reponses: number;
  statut_portail?: string;
}

export interface DANonSoldeeX3ListResponse {
  items: DANonSoldeeX3[];
  total: number;
  page: number;
  limit: number;
}
