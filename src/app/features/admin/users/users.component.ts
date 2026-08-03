import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User, UserCreate, UserUpdate, UserRole } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Modal states
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showResetPasswordModal = signal(false);

  // Form data
  selectedUser = signal<User | null>(null);
  tempPassword = signal<string | null>(null);

  // Create form
  createForm = signal<UserCreate>({
    username: '',
    email: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'acheteur'
  });

  // Edit form
  editForm = signal<UserUpdate>({
    email: '',
    nom: '',
    prenom: '',
    role: 'acheteur',
    actif: true
  });

  // Filter
  searchTerm = signal('');
  roleFilter = signal<string>('all');

  // Filtered users
  filteredUsers = computed(() => {
    let result = this.users();
    const term = this.searchTerm().toLowerCase();
    const role = this.roleFilter();

    if (term) {
      result = result.filter(u =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.nom?.toLowerCase() || '').includes(term) ||
        (u.prenom?.toLowerCase() || '').includes(term)
      );
    }

    if (role !== 'all') {
      result = result.filter(u => u.role === role);
    }

    return result;
  });

  // Stats
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.actif).length);
  adminCount = computed(() => this.users().filter(u => u.role === 'admin').length);

  roles: { value: UserRole; label: string }[] = [
    { value: 'acheteur', label: 'Acheteur' },
    { value: 'responsable_achat', label: 'Responsable Achat' },
    { value: 'admin', label: 'Administrateur' }
  ];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getAll().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error.set('Impossible de charger les utilisateurs');
        this.loading.set(false);
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Create User
  // ─────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm.set({
      username: '',
      email: '',
      password: '',
      nom: '',
      prenom: '',
      role: 'acheteur'
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  createUser(): void {
    const form = this.createForm();

    if (!form.username || !form.email || !form.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.userService.create(form).subscribe({
      next: () => {
        this.closeCreateModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error creating user:', err);
        alert(err.error?.detail || 'Erreur lors de la creation');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Edit User
  // ─────────────────────────────────────────────────────────

  openEditModal(user: User): void {
    this.selectedUser.set(user);
    this.editForm.set({
      email: user.email,
      nom: user.nom || '',
      prenom: user.prenom || '',
      role: user.role,
      actif: user.actif
    });
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedUser.set(null);
  }

  updateUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.userService.update(user.id, this.editForm()).subscribe({
      next: () => {
        this.closeEditModal();
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error updating user:', err);
        alert(err.error?.detail || 'Erreur lors de la modification');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Toggle Active
  // ─────────────────────────────────────────────────────────

  toggleActive(user: User): void {
    if (!confirm(`Voulez-vous ${user.actif ? 'desactiver' : 'activer'} ${user.username} ?`)) {
      return;
    }

    this.userService.toggleActive(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error toggling user:', err);
        alert(err.error?.detail || 'Erreur lors de la modification');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────────────────────

  resetPassword(user: User): void {
    if (!confirm(`Reinitialiser le mot de passe de ${user.username} ?`)) {
      return;
    }

    this.userService.resetPassword(user.id).subscribe({
      next: (response) => {
        this.selectedUser.set(user);
        this.tempPassword.set(response.temp_password);
        this.showResetPasswordModal.set(true);
      },
      error: (err) => {
        console.error('Error resetting password:', err);
        alert(err.error?.detail || 'Erreur lors de la reinitialisation');
      }
    });
  }

  closeResetPasswordModal(): void {
    this.showResetPasswordModal.set(false);
    this.tempPassword.set(null);
    this.selectedUser.set(null);
  }

  copyPassword(): void {
    const pwd = this.tempPassword();
    if (pwd) {
      navigator.clipboard.writeText(pwd);
      alert('Mot de passe copie!');
    }
  }

  // ─────────────────────────────────────────────────────────
  // Delete User
  // ─────────────────────────────────────────────────────────

  deleteUser(user: User): void {
    if (!confirm(`Supprimer l'utilisateur ${user.username} ? Cette action le desactivera.`)) {
      return;
    }

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        alert(err.error?.detail || 'Erreur lors de la suppression');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────

  getRoleLabel(role: UserRole): string {
    const found = this.roles.find(r => r.value === role);
    return found?.label || role;
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'responsable_achat': return 'badge-responsable';
      default: return 'badge-acheteur';
    }
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
