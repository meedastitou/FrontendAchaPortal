export interface DANonSoldee {
  DA: string;
  Article: string;
  DésignationArticle: string | null;
  QteDA: number | null;
  marque: string | null;
  Unite: string | null;
  Famille: string | null;
}

export interface DasFilters {
  dateDebut: string;
  famille?: string;
  article?: string;
  numeroDa?: string;
}