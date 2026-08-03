import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserCreate, UserUpdate, UsersListResponse, ResetPasswordResponse, UserFamillesResponse, FamillesListResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Lister tous les utilisateurs (Admin only)
   */
  getAll(): Observable<UsersListResponse> {
    return this.http.get<UsersListResponse>(`${this.apiUrl}/users`);
  }

  /**
   * Obtenir un utilisateur par ID (Admin only)
   */
  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Creer un nouvel utilisateur (Admin only)
   */
  create(user: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  /**
   * Modifier un utilisateur (Admin only)
   */
  update(id: number, user: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user);
  }

  /**
   * Activer/Desactiver un utilisateur (Admin only)
   */
  toggleActive(id: number): Observable<{ message: string; actif: boolean }> {
    return this.http.patch<{ message: string; actif: boolean }>(
      `${this.apiUrl}/users/${id}/toggle-active`,
      {}
    );
  }

  /**
   * Reinitialiser le mot de passe (Admin only)
   */
  resetPassword(id: number): Observable<ResetPasswordResponse> {
    return this.http.patch<ResetPasswordResponse>(
      `${this.apiUrl}/users/${id}/reset-password`,
      {}
    );
  }

  /**
   * Supprimer (desactiver) un utilisateur (Admin only)
   */
  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Obtenir les familles d'un utilisateur (Admin only)
   */
  getUserFamilles(userId: number): Observable<UserFamillesResponse> {
    return this.http.get<UserFamillesResponse>(`${this.apiUrl}/users/${userId}/familles`);
  }

  /**
   * Definir les familles d'un utilisateur (Admin only)
   */
  setUserFamilles(userId: number, familles: string[]): Observable<{ message: string; user_id: number; familles: string[] }> {
    return this.http.put<{ message: string; user_id: number; familles: string[] }>(
      `${this.apiUrl}/users/${userId}/familles`,
      familles
    );
  }

  /**
   * Lister toutes les familles disponibles (Admin only)
   */
  getAllFamilles(): Observable<FamillesListResponse> {
    return this.http.get<FamillesListResponse>(`${this.apiUrl}/familles`);
  }
}
