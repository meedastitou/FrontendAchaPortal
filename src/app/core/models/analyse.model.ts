// ══════════════════════════════════════════════════════════
// Analyse des blocages BC
// ══════════════════════════════════════════════════════════

// Import et re-export DANonSoldee depuis DAs-non-soldes.model
import type { DANonSoldee } from './DAs-non-soldes.model';
export type { DANonSoldee };

// Statistiques Funnel (Pipeline)
export interface FunnelStats {
  total_da: number;
  da_avec_rfq: number;
  da_avec_reponses: number;
  da_avec_selections: number;
  da_avec_bc: number;
  taux_rfq: number;
  taux_reponses: number;
  taux_selections: number;
  taux_bc: number;
}

// Statistiques des blocages
export interface BlocageStats {
  total_da_non_soldees: number;
  total_articles_bloques: number;
  nb_non_signees: number;
  nb_prix_superieur_tarif: number;
  nb_marque_differente: number;
  nb_marque_inexistante: number;
  nb_prix_ok_marque_inexistante: number;
  nb_sans_reponse: number;
  montant_ecart_prix_total: number;
}

// Dashboard complet
export interface AnalyseDashboardResponse {
  funnel: FunnelStats;
  blocages: BlocageStats;
  derniere_sync_x3: string | null;
}

// ──────────────────────────────────────────────────────────
// Articles non signés
// ──────────────────────────────────────────────────────────

export interface ArticleNonSigne {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite: number;
  unite: string | null;
  marque_souhaitee: string | null;
  niveau_signature: number;
  libelle_signature: string;
  nb_reponses: number;
  meilleur_prix: number | null;
  meilleur_fournisseur: string | null;
}

export interface ArticleNonSigneListResponse {
  items: ArticleNonSigne[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Articles prix > tarif
// ──────────────────────────────────────────────────────────

export interface ArticlePrixSuperieur {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite: number;
  tarif_reference: number;
  prix_min_propose: number;
  ecart_min_pourcent: number;
  ecart_min_montant: number;
  fournisseur_moins_cher: string;
  nom_fournisseur: string | null;
  nb_offres: number;
}

export interface ArticlePrixSuperieurListResponse {
  items: ArticlePrixSuperieur[];
  total: number;
  page: number;
  limit: number;
  montant_ecart_total: number;
}

// ──────────────────────────────────────────────────────────
// Articles marque différente
// ──────────────────────────────────────────────────────────

export interface ArticleMarqueDifferente {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite: number;
  marque_souhaitee: string;
  marque_proposee: string;
  marque_existe_x3: boolean;
  code_fournisseur: string;
  nom_fournisseur: string | null;
  prix_propose: number;
  nb_offres_conformes: number;
}

export interface ArticleMarqueDifferenteListResponse {
  items: ArticleMarqueDifferente[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Articles marque inexistante dans X3
// ──────────────────────────────────────────────────────────

export interface ArticleMarqueInexistante {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite: number;
  marque_proposee: string;
  marques_valides_x3: string[];
  code_fournisseur: string;
  nom_fournisseur: string | null;
  prix_propose: number;
}

export interface ArticleMarqueInexistanteListResponse {
  items: ArticleMarqueInexistante[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Articles prix OK mais marque inexistante
// ──────────────────────────────────────────────────────────

export interface ArticlePrixOkMarqueInex {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite: number;
  tarif_reference: number;
  prix_propose: number;
  ecart_pourcent: number;
  marque_proposee: string;
  marques_valides_x3: string[];
  code_fournisseur: string;
  nom_fournisseur: string | null;
}

export interface ArticlePrixOkMarqueInexListResponse {
  items: ArticlePrixOkMarqueInex[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Articles sans réponse
// ──────────────────────────────────────────────────────────

export interface ArticleSansReponse {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite: number;
  unite: string | null;
  marque_souhaitee: string | null;
  nb_rfq_envoyees: number;
  fournisseurs_consultes: string[];
  date_premiere_rfq: string | null;
  jours_depuis_rfq: number;
}

export interface ArticleSansReponseListResponse {
  items: ArticleSansReponse[];
  total: number;
  page: number;
  limit: number;
}

// ──────────────────────────────────────────────────────────
// Filtres
// ──────────────────────────────────────────────────────────

export interface BlocageFilters {
  page?: number;
  limit?: number;
  numero_da?: string;
  code_article?: string;
  ecart_min?: number;
  jours_min?: number;
}

// Types de blocage
export type TypeBlocage = 'non-signes' | 'prix-superieur' | 'marque-differente' | 'marque-inexistante' | 'prix-ok-marque-inex' | 'sans-reponse' | 'da-sans-rfq' | 'rfq-sans-reponse' | 'rfq-avec-reponse';

// ──────────────────────────────────────────────────────────
// RFQ DA Non Soldées
// ──────────────────────────────────────────────────────────

export interface LigneRFQAnalyse {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  quantite_demandee: number;
  unite: string | null;
}

export interface RFQSansReponseAnalyse {
  id: number;
  uuid: string;
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  email_fournisseur: string | null;
  date_envoi: string;
  statut: string;
  nb_relances: number;
  date_derniere_relance: string | null;
  jours_depuis_envoi: number;
  lignes: LigneRFQAnalyse[];
  nb_articles: number;
}

export interface RFQAvecReponseAnalyse {
  id: number;
  uuid: string;
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  email_fournisseur: string | null;
  date_envoi: string;
  date_reponse: string;
  statut: string;
  delai_reponse_heures: number;
  lignes: LigneRFQAnalyse[];
  nb_articles: number;
}

export interface DANonSoldeAnalyseResponse {
  da_non_soldees: DANonSoldee[];
  total_da: number;
  da_sans_rfq: DANonSoldee[];
  total_sans_rfq: number;
  rfqs_sans_reponse: RFQSansReponseAnalyse[];
  total_sans_reponse: number;
  rfqs_avec_reponse: RFQAvecReponseAnalyse[];
  total_avec_reponse: number;
}
