export interface ReponseEntete {
  id: number;
  rfq_uuid: string;
  reference_fournisseur: string | null;
  fichier_devis_url: string | null;
  devise: string;
  methodes_paiement: string | null;
  date_reponse: string;
  commentaire: string | null;
  created_at: string;
}

export interface ReponseDetail {
  id: number;
  reponse_entete_id: number;
  rfq_uuid: string;
  ligne_cotation_id: number;
  code_article: string;
  prix_unitaire_ht: number | null;
  date_livraison: string | null;
  quantite_disponible: number | null;
  marque_conforme: boolean | null;
  marque_proposee: string | null;
  fichier_joint_url: string | null;
  commentaire_article: string | null;
  // Champs depuis lignes_cotation
  designation_article: string | null;
  marque_demandee: string | null;
  numero_da: string | null;
  quantite_demandee: number | null;
  // Champ depuis articles_ref (prix maximum d'achat)
  tarif_reference: number | null;
}

export interface ReponseComplete {
  entete: ReponseEntete;
  details: ReponseDetail[];
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur: string;
}

export interface ReponseListResponse {
  reponses: ReponseComplete[];
  total: number;
  page: number;
  limit: number;
}

export interface OffreComparaison {
  code_article: string;
  designation_article: string | null;
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  prix_unitaire_ht: number;
  date_livraison: string | null;
  quantite_disponible: number | null;
  marque_conforme: boolean | null;
  marque_proposee: string | null;
  devise: string;
}

export interface ComparaisonAnalyse {
  nb_offres: number;
  prix_min: number | null;
  prix_max: number | null;
  prix_moyen: number | null;
  meilleur_fournisseur: string | null;
  meilleur_prix: number | null;
}

export interface ComparaisonResponse {
  code_article: string;
  designation: string | null;
  offres: OffreComparaison[];
  analyse: ComparaisonAnalyse | null;
}

export interface Rejet {
  id: number;
  rfq_uuid: string;
  motif_rejet: string | null;
  type_rejet: 'email' | 'formulaire';
  date_rejet: string;
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur: string;
}

// ══════════════════════════════════════════════════════════
// Dashboard Comparaison
// ══════════════════════════════════════════════════════════

export interface OffreDashboard {
  detail_id: number;
  code_fournisseur: string;
  nom_fournisseur: string;
  prix_unitaire_ht: number;
  quantite_disponible: number | null;
  date_livraison: string | null;
  marque_conforme: boolean | null;
  marque_proposee: string | null;
  devise: string;
  date_reponse: string;
  methodes_paiement: string | null;
  is_acheteur?: boolean;
}

export interface FournisseurEnAttente {
  code_fournisseur: string;
  nom_fournisseur: string;
  date_envoi: string;
}

export interface ArticleDashboard {
  code_article: string;
  designation: string | null;
  marque_demandee: string | null;
  tarif_reference: number | null;
  quantite_demandee: number;
  das: string[];
  offres: OffreDashboard[];
  fournisseurs_en_attente: FournisseurEnAttente[];
  analyse: ComparaisonAnalyse;
}

export interface ComparaisonDashboardResponse {
  articles: ArticleDashboard[];
  total_articles: number;
  total_offres: number;
}

// ══════════════════════════════════════════════════════════
// Saisie Manuelle de Réponse (Tables _acheteur)
// ══════════════════════════════════════════════════════════

export interface LigneReponseAcheteur {
  code_article: string;

  // Fournisseur pour CETTE ligne
  code_fournisseur?: string;
  nom_fournisseur: string;
  email_fournisseur: string;
  telephone_fournisseur?: string;

  // Infos cotation
  prix_unitaire_ht?: number;
  quantite_disponible?: number;
  delai_livraison_jours?: number;
  date_livraison_prevue?: string;

  // Marque
  marque_conforme?: boolean;
  marque_proposee?: string;

  // Reference fournisseur
  reference_fournisseur?: string;

  // Commentaire
  commentaire_ligne?: string;
}

export interface ReponseAcheteurRequest {
  numero_da: string;
  devise: string;
  conditions_paiement?: string;
  commentaire_global?: string;
  lignes: LigneReponseAcheteur[];
}

export interface ReponseAcheteurResponse {
  success: boolean;
  message: string;
  numero_rfq?: string;
  uuid_reponse?: string;
  nb_lignes: number;
}

// ══════════════════════════════════════════════════════════
// Lecture des reponses acheteur
// ══════════════════════════════════════════════════════════

export interface LigneReponseAcheteurDetail {
  id: number;
  code_article: string;
  designation_article: string | null;
  quantite_demandee: number | null;
  code_fournisseur: string | null;
  nom_fournisseur: string;
  email_fournisseur: string;
  prix_unitaire_ht: number | null;
  quantite_disponible: number | null;
  delai_livraison_jours: number | null;
  marque_proposee: string | null;
  statut_ligne: string;
}

export interface ReponseAcheteurComplete {
  id: number;
  uuid_reponse: string;
  rfq_uuid: string;
  numero_rfq: string;
  numero_da: string;
  devise: string;
  conditions_paiement: string | null;
  date_soumission: string;
  commentaire_global: string | null;
  saisi_par_email: string | null;
  lignes: LigneReponseAcheteurDetail[];
}

export interface ReponseAcheteurListResponse {
  reponses: ReponseAcheteurComplete[];
  total: number;
  page: number;
  limit: number;
}

// ══════════════════════════════════════════════════════════
// Articles DA pour saisie
// ══════════════════════════════════════════════════════════

export interface ArticleDA {
  code_article: string;
  designation_article: string | null;
  quantite: number;
  unite: string | null;
  marque_souhaitee: string | null;
  tarif_reference: number | null;
}

export interface ArticlesDAResponse {
  numero_da: string;
  articles: ArticleDA[];
  total: number;
}

export interface DAResume {
  numero_da: string;
  nb_articles: number;
  date_creation: string;
  statut: string;
}

export interface DAListResponse {
  das: DAResume[];
  total: number;
  page: number;
  limit: number;
}
