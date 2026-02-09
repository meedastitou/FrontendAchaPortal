import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { User, UserRole, Famille, UserCreate } from '../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Gestion des Utilisateurs</h1>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + Nouvel Utilisateur
        </button>
      </div>

      <!-- Tableau -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading">Chargement...</div>
        } @else if (users().length === 0) {
          <div class="empty">Aucun utilisateur trouve</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Role</th>
                <th>Familles</th>
                <th>Statut</th>
                <th>Derniere connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr [class.inactive]="!user.actif">
                  <td>
                    <div class="user-cell">
                      <span class="user-name">{{ user.prenom }} {{ user.nom }}</span>
                      <span class="user-username">{{ user.username }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + user.role">
                      {{ formatRole(user.role) }}
                    </span>
                  </td>
                  <td>
                    <div class="familles-cell">
                      @if (userFamilles()[user.id]?.length) {
                        @for (f of userFamilles()[user.id].slice(0, 2); track f.code_famille) {
                          <span class="famille-tag">{{ f.code_famille }}</span>
                        }
                        @if (userFamilles()[user.id].length > 2) {
                          <span class="famille-more">+{{ userFamilles()[user.id].length - 2 }}</span>
                        }
                      } @else if (user.role === 'acheteur') {
                        <span class="no-famille">Aucune</span>
                      } @else {
                        <span class="all-famille">Toutes</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="status-dot" [class.active]="user.actif"></span>
                    {{ user.actif ? 'Actif' : 'Inactif' }}
                  </td>
                  <td>
                    {{ user.derniere_connexion ? formatDate(user.derniere_connexion) : 'Jamais' }}
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn-icon" (click)="openFamillesModal(user)" title="Gerer familles">
                        F
                      </button>
                      <button class="btn-icon" (click)="openEditModal(user)" title="Modifier">
                        E
                      </button>
                      <button
                        class="btn-icon"
                        [class.danger]="user.actif"
                        [class.success]="!user.actif"
                        (click)="toggleActive(user)"
                        [title]="user.actif ? 'Desactiver' : 'Activer'"
                      >
                        {{ user.actif ? 'X' : '+' }}
                      </button>
                      <button class="btn-icon warning" (click)="resetPassword(user)" title="Reset mot de passe">
                        R
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Modal Familles -->
      @if (showFamillesModal && selectedUser) {
        <div class="modal-overlay" (click)="showFamillesModal = false">
          <div class="modal modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Familles de {{ selectedUser.prenom }} {{ selectedUser.nom }}</h3>
              <button class="close-btn" (click)="showFamillesModal = false">X</button>
            </div>
            <div class="modal-body">
              @if (selectedUser.role !== 'acheteur') {
                <div class="info-box">
                  Les utilisateurs avec le role <strong>{{ formatRole(selectedUser.role) }}</strong>
                  ont acces a toutes les familles.
                </div>
              } @else {
                <p>Selectionnez les familles que cet acheteur peut gerer:</p>
                <div class="familles-grid">
                  @for (famille of allFamilles(); track famille.code_famille) {
                    <label class="famille-checkbox">
                      <input
                        type="checkbox"
                        [checked]="selectedFamilles.has(famille.code_famille)"
                        (change)="toggleFamille(famille.code_famille)"
                      />
                      <span class="checkmark"></span>
                      <span class="famille-info">
                        <span class="famille-code">{{ famille.code_famille }}</span>
                        <span class="famille-nom">{{ famille.nom_famille }}</span>
                      </span>
                    </label>
                  }
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showFamillesModal = false">Annuler</button>
              @if (selectedUser.role === 'acheteur') {
                <button class="btn btn-primary" (click)="saveFamilles()" [disabled]="savingFamilles()">
                  {{ savingFamilles() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Modal Edit User -->
      @if (showEditModal && selectedUser) {
        <div class="modal-overlay" (click)="showEditModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Modifier l'utilisateur</h3>
              <button class="close-btn" (click)="showEditModal = false">X</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="editForm.email" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Prenom</label>
                  <input type="text" [(ngModel)]="editForm.prenom" />
                </div>
                <div class="form-group">
                  <label>Nom</label>
                  <input type="text" [(ngModel)]="editForm.nom" />
                </div>
              </div>
              <div class="form-group">
                <label>Role</label>
                <select [(ngModel)]="editForm.role">
                  <option value="acheteur">Acheteur</option>
                  <option value="responsable_achat">Responsable Achat</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showEditModal = false">Annuler</button>
              <button class="btn btn-primary" (click)="saveEdit()">Enregistrer</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Create User -->
      @if (showCreateModal) {
        <div class="modal-overlay" (click)="showCreateModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Nouvel utilisateur</h3>
              <button class="close-btn" (click)="showCreateModal = false">X</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Nom d'utilisateur *</label>
                <input type="text" [(ngModel)]="createForm.username" placeholder="ex: jdupont" />
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input type="email" [(ngModel)]="createForm.email" placeholder="ex: jean.dupont&#64;company.com" />
              </div>
              <div class="form-group">
                <label>Mot de passe *</label>
                <input type="password" [(ngModel)]="createForm.password" placeholder="Min. 6 caracteres" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Prenom</label>
                  <input type="text" [(ngModel)]="createForm.prenom" />
                </div>
                <div class="form-group">
                  <label>Nom</label>
                  <input type="text" [(ngModel)]="createForm.nom" />
                </div>
              </div>
              <div class="form-group">
                <label>Role</label>
                <select [(ngModel)]="createForm.role">
                  <option value="acheteur">Acheteur</option>
                  <option value="responsable_achat">Responsable Achat</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="showCreateModal = false">Annuler</button>
              <button
                class="btn btn-primary"
                (click)="createUser()"
                [disabled]="!createForm.username || !createForm.email || !createForm.password"
              >
                Creer
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Password Reset Result -->
      @if (showPasswordModal) {
        <div class="modal-overlay" (click)="showPasswordModal = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Mot de passe reinitialise</h3>
              <button class="close-btn" (click)="showPasswordModal = false">X</button>
            </div>
            <div class="modal-body">
              <p>Le nouveau mot de passe temporaire est:</p>
              <div class="password-display">{{ tempPassword }}</div>
              <p class="warning-text">Communiquez ce mot de passe a l'utilisateur de maniere securisee.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-primary" (click)="showPasswordModal = false">Fermer</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
      color: #1f2937;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #2d5a87, #1e3a5f);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(45, 90, 135, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      transform: none;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    /* Table */
    .table-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 14px 16px;
      text-align: left;
    }

    .data-table th {
      background: #f9fafb;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .data-table td {
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .data-table tr:hover td {
      background: #f9fafb;
    }

    .data-table tr.inactive td {
      opacity: 0.6;
    }

    .user-cell {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
    }

    .user-username {
      font-size: 12px;
      color: #6b7280;
    }

    .badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-admin { background: #fef3c7; color: #d97706; }
    .badge-responsable_achat { background: #dbeafe; color: #2563eb; }
    .badge-acheteur { background: #dcfce7; color: #16a34a; }

    .familles-cell {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .famille-tag {
      background: #e0e7ff;
      color: #4338ca;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
    }

    .famille-more {
      color: #6b7280;
      font-size: 11px;
    }

    .no-famille {
      color: #dc2626;
      font-size: 12px;
      font-style: italic;
    }

    .all-famille {
      color: #16a34a;
      font-size: 12px;
    }

    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #dc2626;
      margin-right: 6px;
    }

    .status-dot.active {
      background: #16a34a;
    }

    .actions {
      display: flex;
      gap: 6px;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: #f3f4f6;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
    }

    .btn-icon:hover {
      background: #e5e7eb;
    }

    .btn-icon.danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-icon.success {
      background: #dcfce7;
      color: #16a34a;
    }

    .btn-icon.warning {
      background: #fef3c7;
      color: #d97706;
    }

    .loading, .empty {
      padding: 60px;
      text-align: center;
      color: #9ca3af;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 450px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }

    .modal-lg {
      max-width: 600px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: white;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
    }

    .modal-body {
      padding: 20px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      position: sticky;
      bottom: 0;
      background: white;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 14px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #2d5a87;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-box {
      background: #dbeafe;
      color: #1e40af;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
    }

    .familles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      max-height: 400px;
      overflow-y: auto;
      margin-top: 16px;
    }

    .famille-checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .famille-checkbox:hover {
      background: #f9fafb;
    }

    .famille-checkbox input {
      display: none;
    }

    .famille-checkbox .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .famille-checkbox input:checked + .checkmark {
      background: #2d5a87;
      border-color: #2d5a87;
    }

    .famille-checkbox input:checked + .checkmark::after {
      content: '✓';
      color: white;
      font-size: 12px;
    }

    .famille-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .famille-code {
      font-weight: 600;
      font-size: 13px;
    }

    .famille-nom {
      font-size: 11px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .password-display {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 18px;
      text-align: center;
      margin: 16px 0;
      user-select: all;
    }

    .warning-text {
      color: #d97706;
      font-size: 13px;
    }
  `]
})
export class UserListComponent implements OnInit {
  users = signal<User[]>([]);
  allFamilles = signal<Famille[]>([]);
  userFamilles = signal<Record<number, Famille[]>>({});
  loading = signal(false);
  savingFamilles = signal(false);

  selectedUser: User | null = null;
  selectedFamilles = new Set<string>();

  showFamillesModal = false;
  showEditModal = false;
  showCreateModal = false;
  showPasswordModal = false;

  tempPassword = '';

  editForm = {
    email: '',
    nom: '',
    prenom: '',
    role: 'acheteur' as UserRole
  };

  createForm: UserCreate = {
    username: '',
    email: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'acheteur'
  };

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAllFamilles();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getAll().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.loading.set(false);
        // Charger les familles pour chaque utilisateur
        response.users.forEach(user => {
          if (user.role === 'acheteur') {
            this.loadUserFamilles(user.id);
          }
        });
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading.set(false);
      }
    });
  }

  loadAllFamilles(): void {
    this.userService.getAllFamilles().subscribe({
      next: (response) => {
        this.allFamilles.set(response.familles);
      },
      error: (err) => console.error('Error loading familles:', err)
    });
  }

  loadUserFamilles(userId: number): void {
    this.userService.getUserFamilles(userId).subscribe({
      next: (response) => {
        this.userFamilles.update(current => ({
          ...current,
          [userId]: response.familles
        }));
      }
    });
  }

  openFamillesModal(user: User): void {
    this.selectedUser = user;
    this.selectedFamilles.clear();

    const familles = this.userFamilles()[user.id] || [];
    familles.forEach(f => this.selectedFamilles.add(f.code_famille));

    this.showFamillesModal = true;
  }

  toggleFamille(code: string): void {
    if (this.selectedFamilles.has(code)) {
      this.selectedFamilles.delete(code);
    } else {
      this.selectedFamilles.add(code);
    }
  }

  saveFamilles(): void {
    if (!this.selectedUser) return;

    this.savingFamilles.set(true);
    const familles = Array.from(this.selectedFamilles);

    this.userService.setUserFamilles(this.selectedUser.id, familles).subscribe({
      next: () => {
        this.loadUserFamilles(this.selectedUser!.id);
        this.showFamillesModal = false;
        this.savingFamilles.set(false);
      },
      error: (err) => {
        console.error('Error saving familles:', err);
        this.savingFamilles.set(false);
      }
    });
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.editForm = {
      email: user.email,
      nom: user.nom || '',
      prenom: user.prenom || '',
      role: user.role
    };
    this.showEditModal = true;
  }

  saveEdit(): void {
    if (!this.selectedUser) return;

    this.userService.update(this.selectedUser.id, this.editForm).subscribe({
      next: () => {
        this.loadUsers();
        this.showEditModal = false;
      },
      error: (err) => console.error('Error updating user:', err)
    });
  }

  openCreateModal(): void {
    this.createForm = {
      username: '',
      email: '',
      password: '',
      nom: '',
      prenom: '',
      role: 'acheteur'
    };
    this.showCreateModal = true;
  }

  createUser(): void {
    this.userService.create(this.createForm).subscribe({
      next: () => {
        this.loadUsers();
        this.showCreateModal = false;
      },
      error: (err) => console.error('Error creating user:', err)
    });
  }

  toggleActive(user: User): void {
    const action = user.actif ? 'desactiver' : 'activer';
    if (!confirm(`Voulez-vous ${action} ${user.username} ?`)) return;

    this.userService.toggleActive(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => console.error('Error toggling user:', err)
    });
  }

  resetPassword(user: User): void {
    if (!confirm(`Reinitialiser le mot de passe de ${user.username} ?`)) return;

    this.userService.resetPassword(user.id).subscribe({
      next: (response) => {
        this.tempPassword = response.temp_password;
        this.showPasswordModal = true;
      },
      error: (err) => console.error('Error resetting password:', err)
    });
  }

  formatRole(role: UserRole): string {
    const map: Record<UserRole, string> = {
      admin: 'Admin',
      responsable_achat: 'Resp. Achat',
      acheteur: 'Acheteur'
    };
    return map[role] || role;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
