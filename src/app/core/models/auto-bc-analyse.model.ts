// ════════════════════════════════════════════════════════════
// Auto BC Analyse - Modeles
// ════════════════════════════════════════════════════════════

// Reponse consultee pendant l'analyse
export interface AnalyseReponseConsultee {
  detail_id: number;
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  code_fournisseur: string;
  nom_fournisseur: string | null;
  prix_unitaire_ht: number;
  quantite_disponible: number;
  marque_proposee: string | null;
  date_reponse: string;
  incluse: boolean;
  raison_exclusion: string | null;
}

// Modification de marque
export interface UpdateMarqueRequest {
  marque: string;
}

export interface UpdateMarqueResponse {
  success: boolean;
  message: string;
  detail_id: number;
  ancienne_marque: string | null;
  nouvelle_marque: string;
}

// Statut DA verifie dans X3
export interface AnalyseStatutDA {
  numero_da: string;
  code_article: string;
  statut_x3: string; // 'ok', 'solde', 'non_signe'
  x3_signee: number | null;
  x3_ligne_solde: number | null;
  x3_da_solde: number | null;
  message: string;
}

// Offre avec prix superieur au tarif X3
export interface AnalysePrixSuperieur {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  code_fournisseur: string;
  nom_fournisseur: string | null;
  prix_propose: number;
  tarif_x3: number;
  ecart_montant: number;
  ecart_pourcent: number;
}

// Offre avec probleme de marque
export interface AnalyseMarqueProbleme {
  numero_da: string;
  code_article: string;
  designation_article: string | null;
  code_fournisseur: string;
  nom_fournisseur: string | null;
  marque_souhaitee: string | null;
  marque_proposee: string | null;
  type_probleme: string; // 'manquante', 'differente', 'non_validee'
  valide_xmarqa: boolean;
  valide_historique: boolean;
  marque_finale: string | null;
  message: string | null;
}

// Analyse complete
export interface AnalyseAutoBC {
  // 1. Reponses consultees
  nb_reponses_consultees: number;
  reponses_consultees: AnalyseReponseConsultee[];

  // 2. Statuts DA (X3)
  nb_da_ok: number;
  nb_da_soldees: number;
  nb_da_soldees_distinct: number;
  nb_da_non_signees: number;
  nb_da_non_signees_distinct: number;
  statuts_da: AnalyseStatutDA[];

  // 3. Prix superieur au tarif X3
  nb_prix_superieur: number;
  montant_ecart_total: number;
  offres_prix_superieur: AnalysePrixSuperieur[];

  // 4. Problemes de marque
  nb_marque_manquante: number;
  nb_marque_differente: number;
  nb_marque_non_validee: number;
  nb_marque_depuis_xmarqa: number;
  offres_marque_probleme: AnalyseMarqueProbleme[];

  // Resume
  resume: string;
}

// Configuration Auto BC
export interface AutoBCConfig {
  code_famille: string;
  periode_heures: number;
  poids_prix: number;
  poids_delai: number;
  delai_max_jours: number;
  dry_run: boolean;
}

// Ligne de BC en preview
export interface BCPreviewLigne {
  code_article: string;
  designation_article: string | null;
  numero_da: string;
  quantite_commandee: number;
  prix_unitaire_ht: number;
  montant_ligne_ht: number;
  type_livraison: string;
  score: number;
  economie_pourcent: number;
  delai_livraison: number | null;
}

// Preview d'un BC a creer
export interface BCPreview {
  code_fournisseur: string;
  nom_fournisseur: string;
  lignes: BCPreviewLigne[];
  nb_lignes: number;
  montant_total_ht: number;
  montant_tva: number;
  montant_total_ttc: number;
  das_incluses: string[];
}

// Reponse complete du preview Auto BC
export interface AutoBCPreviewResponse {
  config: AutoBCConfig;
  date_preview: string;

  // Statistiques
  nb_articles_eligibles: number;
  nb_articles_avec_offre_complete: number;
  nb_articles_avec_offre_partielle: number;
  nb_articles_sans_offre: number;

  // BC a creer (groupes par fournisseur)
  bcs_preview: BCPreview[];
  nb_bc_a_creer: number;

  // Articles sans offre conforme
  articles_sans_offre: string[];

  // Economie totale estimee
  economie_totale_estimee: number;

  // Analyse detaillee
  analyse: AnalyseAutoBC | null;
}
