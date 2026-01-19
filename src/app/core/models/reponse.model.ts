export interface ReponseEntete {
  id: number;
  rfq_uuid: string;
  reference_fournisseur: string | null;
  fichier_devis_url: string | null;
  devise: string;
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
