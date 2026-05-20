import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';


export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard]
  },
  {
    path: 'add-task',
    loadComponent: () => import('./pages/add-task/add-task.page').then(m => m.AddTaskPage),
    canActivate: [authGuard]
  },
  {
    path: 'add-task/:id',
    loadComponent: () => import('./pages/add-task/add-task.page').then(m => m.AddTaskPage),
    canActivate: [authGuard]
  },
  {
    path: 'tasks',
    loadComponent: () => import('./pages/tasks/tasks.page').then(m => m.TasksPage),
    canActivate: [authGuard]
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats.page').then(m => m.StatsPage),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./pages/calendar/calendar.page').then(m => m.CalendarPage),
    canActivate: [authGuard]
  },
  {
    path: 'global-tasks',
    loadComponent: () => import('./pages/global-tasks/global-tasks.page').then(m => m.GlobalTasksPage),
    canActivate: [authGuard]
  },
  {
    path: 'global-task/:id',
    loadComponent: () => import('./pages/global-task-detail/global-task-detail.page').then(m => m.GlobalTaskDetailPage),
    canActivate: [authGuard]
  },
];