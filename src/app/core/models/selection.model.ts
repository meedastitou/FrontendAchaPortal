// ══════════════════════════════════════════════════════════
// Selection Articles (Pre-Bon de Commande)
// ══════════════════════════════════════════════════════════

export type StatutSelection = 'selectionne' | 'en_attente_bc' | 'bc_genere';

export interface SelectionArticle {
  id: number;
  code_article: string;
  designation: string | null;
  numero_da: string;
  quantite: number;
  unite: string | null;

  // Fournisseur
  code_fournisseur: string;
  nom_fournisseur: string | null;
  detail_id: number;

  // Prix et marque
  prix_selectionne: number;
  devise: string;
  marque_proposee: string | null;
  marque_conforme: boolean | null;

  // Livraison
  date_livraison: string | null;
  delai_livraison: number | null;

  // Tracabilite
  selection_auto: boolean;
  modifie_par: string | null;
  date_selection: string;
  date_modification: string | null;

  // Statut
  statut: StatutSelection;
  numero_bc: string | null;
}

export interface SelectionArticleCreate {
  code_article: string;
  designation?: string;
  numero_da: string;
  quantite: number;
  unite?: string;
  code_fournisseur: string;
  detail_id: number;
  prix_selectionne: number;
  devise?: string;
  marque_proposee?: string;
  marque_conforme?: boolean;
  date_livraison?: string;
  delai_livraison?: number;
}

export interface SelectionArticleUpdate {
  code_fournisseur: string;
  detail_id: number;
  prix_selectionne: number;
  devise?: string;
  marque_proposee?: string;
  marque_conforme?: boolean;
  date_livraison?: string;
  delai_livraison?: number;
}

export interface SelectionAutoResponse {
  success: boolean;
  message: string;
  nb_articles_selectionnes: number;
  selections: SelectionArticle[];
}

// ══════════════════════════════════════════════════════════
// Pre-BC Dashboard (groupe par fournisseur)
// ══════════════════════════════════════════════════════════

export interface ArticleSelectionne {
  id: number;
  code_article: string;
  designation: string | null;
  numero_da: string;
  quantite: number;
  unite: string | null;
  prix_unitaire: number;
  montant_ligne: number;
  devise: string;
  marque_proposee: string | null;
  marque_conforme: boolean | null;
  date_livraison: string | null;
  selection_auto: boolean;
}

export interface FournisseurPreBC {
  code_fournisseur: string;
  nom_fournisseur: string;
  email: string | null;
  telephone: string | null;
  articles: ArticleSelectionne[];
  nb_articles: number;
  nb_das: number;
  das: string[];
  montant_total_ht: number;
  devise: string;
}

export interface PreBCDashboardResponse {
  fournisseurs: FournisseurPreBC[];
  total_fournisseurs: number;
  total_articles: number;
  total_das: number;
  montant_global_ht: number;
}

// ══════════════════════════════════════════════════════════
// Generation BC depuis Pre-BC
// ══════════════════════════════════════════════════════════

export interface GenererBCFromPreBCRequest {
  code_fournisseur: string;
  selection_ids: number[];
  conditions_paiement?: string;
  lieu_livraison?: string;
  commentaire?: string;
}

export interface GenererBCFromPreBCResponse {
  success: boolean;
  message: string;
  numero_bc: string | null;
  code_fournisseur: string | null;
  nom_fournisseur: string | null;
  nb_lignes: number | null;
  montant_total_ht: number | null;
  montant_total_ttc: number | null;
}
