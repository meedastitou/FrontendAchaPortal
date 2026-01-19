export interface DashboardStats {
  total_da_actives: number;
  rfq_en_attente: number;
  rfq_repondues: number;
  rfq_rejetees: number;
  fournisseurs_actifs: number;
  fournisseurs_blacklistes: number;
  commandes_en_cours: number;
  taux_reponse_moyen: number;
}

export interface DashboardStatsDetailed extends DashboardStats {
  total_rfq_envoyees: number;
  total_commandes: number;
  montant_total_commandes: number;
  delai_moyen_reponse_heures: number;
}

export interface RFQStatusChart {
  envoye: number;
  vu: number;
  repondu: number;
  rejete: number;
  expire: number;
  relance_1: number;
  relance_2: number;
  relance_3: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string;
  date: string;
  details: Record<string, any> | null;
}

export interface TopFournisseur {
  code_fournisseur: string;
  nom_fournisseur: string;
  taux_reponse: number;
  note_performance: number;
  nb_reponses: number;
}

export interface AlertItem {
  id: number;
  type: 'info' | 'warning' | 'error';
  titre: string;
  message: string;
  date: string;
  lien: string;
}
