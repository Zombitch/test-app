import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'hub',
    pathMatch: 'full',
  },
  {
    path: 'hub',
    loadComponent: () => import('./features/hub/hub').then(m => m.HubComponent),
  },
  {
    path: 'run',
    loadComponent: () => import('./features/run/run').then(m => m.RunComponent),
  },
  {
    path: 'result',
    loadComponent: () => import('./features/result/result').then(m => m.ResultComponent),
  },
];
