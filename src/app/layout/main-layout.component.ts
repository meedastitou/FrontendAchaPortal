import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout">
      <!-- Fond sombre derrière le menu (mobile) -->
      @if (isMobile() && drawerOpen()) {
        <div class="backdrop" (click)="closeDrawer()"></div>
      }

      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="compact()" [class.mobile-open]="drawerOpen()">
        <div class="sidebar-header">
          <div class="logo">
            <span class="logo-icon">FA</span>
            @if (!compact()) {
              <span class="logo-text">Flux Achat</span>
            }
          </div>
          <button class="toggle-btn" (click)="toggleSidebar()" [attr.aria-label]="isMobile() ? 'Fermer le menu' : 'Réduire le menu'">
            <span class="toggle-icon">{{ isMobile() ? '✕' : (compact() ? '>' : '<') }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">D</span>
            @if (!compact()) {
              <span class="nav-text">Dashboard</span>
            }
          </a>

          <a routerLink="/fournisseurs" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">F</span>
            @if (!compact()) {
              <span class="nav-text">Fournisseurs</span>
            }
          </a>

          <a routerLink="/DAs-non-soldes" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">DA</span>
            @if (!compact()) {
              <span class="nav-text">DAs non soldes</span>
            }
          </a>

          <a routerLink="/rfq" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">R</span>
            @if (!compact()) {
              <span class="nav-text">Demandes (RFQ)</span>
            }
          </a>

          <a routerLink="/reponses" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">O</span>
            @if (!compact()) {
              <span class="nav-text">Offres</span>
            }
          </a>

          <a routerLink="/comparaison" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">C</span>
            @if (!compact()) {
              <span class="nav-text">Comparaison</span>
            }
          </a>

          <a routerLink="/pre-bon-commande" routerLinkActive="active" class="nav-item highlight">
            <span class="nav-icon">P</span>
            @if (!compact()) {
              <span class="nav-text">Pre-BC</span>
            }
          </a>

          <!-- <a routerLink="/decision" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">V</span>
            @if (!compact()) {
              <span class="nav-text">Decisions</span>
            }
          </a> -->

          <a routerLink="/bon-commande" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">B</span>
            @if (!compact()) {
              <span class="nav-text">Bons Commande</span>
            }
          </a>

          <a routerLink="/annulation-bc" routerLinkActive="active" class="nav-item annulation-item">
            <span class="nav-icon">X</span>
            @if (!compact()) {
              <span class="nav-text">Annulation BC</span>
            }
          </a>

          <a routerLink="/analyse" routerLinkActive="active" class="nav-item analyse-item">
            <span class="nav-icon">A</span>
            @if (!compact()) {
              <span class="nav-text">Analyse Blocages</span>
            }
          </a>

          @if (authService.currentUser()?.role === 'admin') {
            <div class="nav-divider"></div>
            <a routerLink="/admin/users" routerLinkActive="active" class="nav-item admin-item">
              <span class="nav-icon">U</span>
              @if (!compact()) {
                <span class="nav-text">Utilisateurs</span>
              }
            </a>
            <a routerLink="/admin/cotations" routerLinkActive="active" class="nav-item admin-item">
              <span class="nav-icon">G</span>
              @if (!compact()) {
                <span class="nav-text">Gestion Cotations</span>
              }
            </a>
            <a routerLink="/admin/sync-x3" routerLinkActive="active" class="nav-item admin-item">
              <span class="nav-icon">X3</span>
              @if (!compact()) {
                <span class="nav-text">Sync Sage X3</span>
              }
            </a>
            <a routerLink="/admin/auto-bc-analyse" routerLinkActive="active" class="nav-item admin-item">
              <span class="nav-icon">AB</span>
              @if (!compact()) {
                <span class="nav-text">Analyse Auto BC</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          @if (!compact()) {
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
            @if (!compact()) {
              <span>Déconnexion</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="top-header">
          <div class="header-left">
            <button class="burger-btn" (click)="openDrawer()" aria-label="Ouvrir le menu">
              <span></span><span></span><span></span>
            </button>
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
      top: 0;
      left: 0;
      height: 100vh;
      height: 100dvh;
      z-index: 100;
      overflow-y: auto;
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

    .nav-item.highlight {
      background: rgba(34, 197, 94, 0.2);
      color: #86efac;
    }

    .nav-item.highlight:hover {
      background: rgba(34, 197, 94, 0.3);
    }

    .nav-item.highlight.active {
      background: rgba(34, 197, 94, 0.4);
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

    .nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 12px 16px;
    }

    .nav-item.annulation-item {
      color: rgba(239, 68, 68, 0.8);
    }

    .nav-item.annulation-item:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .nav-item.annulation-item.active {
      background: rgba(239, 68, 68, 0.25);
      color: #f87171;
    }

    .nav-item.analyse-item {
      color: rgba(139, 92, 246, 0.9);
    }

    .nav-item.analyse-item:hover {
      background: rgba(139, 92, 246, 0.15);
      color: #a78bfa;
    }

    .nav-item.analyse-item.active {
      background: rgba(139, 92, 246, 0.25);
      color: #a78bfa;
    }

    .nav-item.admin-item {
      color: rgba(251, 191, 36, 0.8);
    }

    .nav-item.admin-item:hover {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }

    .nav-item.admin-item.active {
      background: rgba(251, 191, 36, 0.25);
      color: #fbbf24;
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
      min-width: 0; /* empêche un tableau large d'élargir toute la page */
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

    /* Bouton burger + fond sombre : cachés sur desktop */
    .burger-btn { display: none; }
    .header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .page-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .backdrop { display: none; }

    /* ===== Tablette ===== */
    @media (max-width: 1024px) {
      .content-wrapper { padding: 16px; }
      .top-header { padding: 14px 16px; }
    }

    /* ===== Mobile : le menu devient un tiroir (drawer) ===== */
    @media (max-width: 768px) {
      .sidebar,
      .sidebar.collapsed {
        width: min(82vw, 290px);
        transform: translateX(-100%);
        transition: transform 0.28s ease;
        box-shadow: none;
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }
      .sidebar.mobile-open {
        transform: translateX(0);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35);
      }

      .backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.5);
        z-index: 90;
        animation: fadeIn 0.2s ease;
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

      /* le contenu prend toute la largeur */
      .main-content,
      .sidebar.collapsed + .main-content,
      .sidebar.collapsed ~ .main-content {
        margin-left: 0;
      }

      .top-header {
        padding: 10px 12px;
        padding-top: calc(10px + env(safe-area-inset-top, 0px));
      }
      .page-title { font-size: 17px; }
      .header-user { display: none; }

      .burger-btn {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        width: 44px;
        height: 44px;
        margin-left: -6px;
        background: transparent;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        flex-shrink: 0;
      }
      .burger-btn span {
        display: block;
        width: 22px;
        height: 2px;
        margin: 0 auto;
        background: #1f2937;
        border-radius: 2px;
      }
      .burger-btn:active { background: #f3f4f6; }

      /* zones tactiles confortables dans le menu */
      .toggle-btn { width: 40px; height: 40px; font-size: 16px; }
      .nav-item { padding: 14px 16px; }
      .logout-btn { padding: 14px; }

      .content-wrapper {
        padding: 12px;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
      }
    }
  `]
})
export class MainLayoutComponent implements OnInit {
  private readonly MOBILE_MAX = 768;
  private readonly TABLET_MAX = 1024;

  /** Menu réduit (desktop / tablette uniquement) */
  sidebarCollapsed = signal(false);
  /** true quand l'écran est un téléphone */
  isMobile = signal(false);
  /** Tiroir de navigation ouvert (mobile uniquement) */
  drawerOpen = signal(false);
  /** Sur mobile le menu n'est jamais « réduit » : on affiche toujours les libellés */
  compact = computed(() => this.sidebarCollapsed() && !this.isMobile());

  pageTitle = 'Dashboard';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Ferme le tiroir après chaque navigation
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.closeDrawer());
  }

  ngOnInit(): void {
    this.applyBreakpoint(true);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.applyBreakpoint(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDrawer();
  }

  private applyBreakpoint(initial: boolean): void {
    const w = window.innerWidth;
    const mobile = w <= this.MOBILE_MAX;
    const wasMobile = this.isMobile();
    this.isMobile.set(mobile);

    if (!mobile) {
      this.drawerOpen.set(false);
    }
    // Tablette : on réduit le menu automatiquement au chargement
    if (initial && !mobile && w <= this.TABLET_MAX) {
      this.sidebarCollapsed.set(true);
    }
    // Retour desktop depuis mobile : état propre
    if (wasMobile && !mobile) {
      this.drawerOpen.set(false);
    }
  }

  get userInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    const prenom = user.prenom || '';
    const nom = user.nom || '';
    return (prenom.charAt(0) + nom.charAt(0)).toUpperCase() || user.username.substring(0, 2).toUpperCase();
  }

  /** Bouton « < » du menu : réduit/agrandit sur desktop, ferme le tiroir sur mobile */
  toggleSidebar(): void {
    if (this.isMobile()) {
      this.closeDrawer();
    } else {
      this.sidebarCollapsed.update((v) => !v);
    }
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  logout(): void {
    this.closeDrawer();
    this.authService.logout();
  }
}