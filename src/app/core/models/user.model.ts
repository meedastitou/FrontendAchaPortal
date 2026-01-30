export type UserRole = 'acheteur' | 'responsable_achat' | 'admin';

export interface User {
  id: number;
  username: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  role: UserRole;
  actif: boolean;
  derniere_connexion: string | null;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  nom?: string;
  prenom?: string;
  role: UserRole;
}

export interface UserUpdate {
  email?: string;
  nom?: string;
  prenom?: string;
  role?: UserRole;
  actif?: boolean;
}

export interface UsersListResponse {
  users: User[];
  total: number;
}

export interface ResetPasswordResponse {
  message: string;
  temp_password: string;
}
