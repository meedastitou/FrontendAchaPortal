import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">FA</span>
            @if (!sidebarCollapsed) {
              <span class="logo-text">Flux Achat</span>
            }
          </div>
          <button class="toggle-btn" (click)="toggleSidebar()">
            <span class="toggle-icon">{{ sidebarCollapsed ? '>' : '<' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">D</span>
            @if (!sidebarCollapsed) {
              <span class="nav-text">Dashboard</span>
            }
          </a>

          <a routerLink="/fournisseurs" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">F</span>
            @if (!sidebarCollapsed) {
              <span class="nav-text">Fournisseurs</span>
            }
          </a>

          <a routerLink="/rfq" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">R</span>
            @if (!sidebarCollapsed) {
              <span class="nav-text">Demandes (RFQ)</span>
            }
          </a>

          <a routerLink="/reponses" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">O</span>
            @if (!sidebarCollapsed) {
              <span class="nav-text">Offres</span>
            }
          </a>

          <a routerLink="/comparaison" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">C</span>
            @if (!sidebarCollapsed) {
              <span class="nav-text">Comparaison</span>
            }
          </a>
        </nav>

        <div class="sidebar-footer">
          @if (!sidebarCollapsed) {
            <div class="user-info">
              <div class="user-avatar">{{ userInitials }}</div>
              <div class="user-details">
                <span class="user-name">{{ authService.currentUser()?.prenom }} {{ authService.currentUser()?.nom }}</span>
                <span class="user-role">{{ authService.currentUser()?.role }}</span>
              </div>
            </div>
          }
          <button class="logout-btn" (click)="logout()">
            <span class="logout-icon">X</span>
            @if (!sidebarCollapsed) {
              <span>Déconnexion</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <div class="header-left">
            <h2 class="page-title">{{ pageTitle }}</h2>
          </div>
          <div class="header-right">
            <div class="header-user">
              <span>{{ authService.currentUser()?.username }}</span>
            </div>
          </div>
        </header>

        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
      background: #f3f4f6;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
    }

    .toggle-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Navigation */
    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .nav-icon {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 12px;
    }

    .nav-text {
      font-size: 14px;
    }

    /* Sidebar Footer */
    .sidebar-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
    }

    .user-role {
      font-size: 12px;
      opacity: 0.7;
      text-transform: capitalize;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 10px;
      background: rgba(220, 38, 38, 0.2);
      border: none;
      color: #fca5a5;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .logout-btn:hover {
      background: rgba(220, 38, 38, 0.3);
    }

    /* Main Content */
    .main-content {
      flex: 1;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
    }

    .sidebar.collapsed + .main-content,
    .sidebar.collapsed ~ .main-content {
      margin-left: 70px;
    }

    .top-header {
      background: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
    }

    .header-user {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #6b7280;
      font-size: 14px;
    }

    .content-wrapper {
      padding: 24px;
    }
  `]
})
export class MainLayoutComponent {
  sidebarCollapsed = false;
  pageTitle = 'Dashboard';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  get userInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    const prenom = user.prenom || '';
    const nom = user.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase() || user.username.substring(0, 2).toUpperCase();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
