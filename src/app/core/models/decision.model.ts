// ──────────────────────────────────────────────────────────
// Models pour Decision Achat
// ──────────────────────────────────────────────────────────

export interface OffreFournisseur {
  code_fournisseur: string;
  nom_fournisseur: string;
  numero_rfq: string;
  prix_unitaire_ht: number | null;
  quantite_disponible: number | null;
  date_livraison: string | null;
  delai_jours: number | null;
  marque_conforme: boolean | null;
  marque_proposee: string | null;
  devise: string;
  commentaire: string | null;
  date_reponse: string;
  score_prix: number | null;
  score_delai: number | null;
  score_global: number | null;
}

export interface ArticleComparaison {
  code_article: string;
  designation: string | null;
  quantite_demandee: number;
  unite: string | null;
  marque_souhaitee: string | null;
  offres: OffreFournisseur[];
  nb_offres: number;
  prix_min: number | null;
  prix_max: number | null;
  prix_moyen: number | null;
  ecart_prix_pourcent: number | null;
  meilleur_prix_fournisseur: string | null;
  meilleur_delai_fournisseur: string | null;
  recommande_fournisseur: string | null;
  recommande_raison: string | null;
}

export interface DAEnAttenteDecision {
  id: number;
  numero_da: string;
  date_creation_da: string;
  date_besoin: string | null;
  priorite: string;
  statut: string;
  nb_articles: number;
  nb_fournisseurs_sollicites: number;
  nb_reponses_recues: number;
  taux_reponse: number;
  articles: ArticleComparaison[];
  montant_min_total: number | null;
  montant_max_total: number | null;
  devise: string;
  date_premiere_reponse: string | null;
  date_derniere_reponse: string | null;
  jours_depuis_premiere_reponse: number | null;
}

export interface DAAttenteListResponse {
  da_list: DAEnAttenteDecision[];
  total: number;
  page: number;
  limit: number;
  total_articles_a_decider: number;
  montant_potentiel_min: number | null;
  montant_potentiel_max: number | null;
}

export interface RFQEnvoyee {
  id: number;
  numero_rfq: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  date_envoi: string;
  statut: string;
  nb_relances: number;
  date_reponse: string | null;
}

export interface DADecisionDetail extends DAEnAttenteDecision {
  rfqs_envoyees: RFQEnvoyee[];
  fournisseur_recommande_global: string | null;
  raison_recommandation: string | null;
  montant_recommande: number | null;
}

export interface CreateCommandeRequest {
  numero_da: string;
  code_fournisseur: string;
  articles: {
    code_article: string;
    designation?: string;
    quantite: number;
    prix_unitaire_ht: number;
  }[];
  commentaire?: string;
}

export interface CreateCommandeResponse {
  success: boolean;
  numero_commande: string | null;
  message: string;
  montant_total_ht: number | null;
}
