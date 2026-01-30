import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'fournisseurs',
        loadComponent: () => import('./features/fournisseurs/fournisseur-list.component').then(m => m.FournisseurListComponent)
      },
      {
        path: 'fournisseurs/:code',
        loadComponent: () => import('./features/fournisseurs/fournisseur-detail.component').then(m => m.FournisseurDetailComponent)
      },
      {
        path: 'rfq',
        loadComponent: () => import('./features/rfq/rfq-list.component').then(m => m.RFQListComponent)
      },
      {
        path: 'rfq/:id',
        loadComponent: () => import('./features/rfq/rfq-detail.component').then(m => m.RFQDetailComponent)
      },
      {
        path: 'reponses',
        loadComponent: () => import('./features/reponses/reponse-list.component').then(m => m.ReponseListComponent)
      },
      {
        path: 'reponses/:id',
        loadComponent: () => import('./features/reponses/reponse-detail.component').then(m => m.ReponseDetailComponent)
      },
      {
        path: 'comparaison',
        loadComponent: () => import('./features/reponses/comparaison-dashboard.component').then(m => m.ComparaisonDashboardComponent)
      },
      {
        path: 'pre-bon-commande',
        loadComponent: () => import('./features/pre-bon-commande/pre-bon-commande.component').then(m => m.PreBonCommandeComponent)
      },
      {
        path: 'decision',
        loadComponent: () => import('./features/decision/decision.component').then(m => m.DecisionComponent)
      },
      {
        path: 'bon-commande',
        loadComponent: () => import('./features/bon-commande/bon-commande-list.component').then(m => m.BonCommandeListComponent)
      },
      {
        path: 'bon-commande/preparer/:codeFournisseur',
        loadComponent: () => import('./features/bon-commande/bon-commande-preparer.component').then(m => m.BonCommandePreparerComponent)
      },
      {
        path: 'bon-commande/:numeroBC',
        loadComponent: () => import('./features/bon-commande/bon-commande-detail.component').then(m => m.BonCommandeDetailComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
