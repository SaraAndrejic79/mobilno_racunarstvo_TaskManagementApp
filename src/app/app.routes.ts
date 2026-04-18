import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then( m => m.RegisterPage)
  },
];
