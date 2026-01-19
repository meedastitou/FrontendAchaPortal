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
        path: 'reponses',
        loadComponent: () => import('./features/reponses/reponse-list.component').then(m => m.ReponseListComponent)
      },
      {
        path: 'comparaison',
        loadComponent: () => import('./features/reponses/comparaison.component').then(m => m.ComparaisonComponent)
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
