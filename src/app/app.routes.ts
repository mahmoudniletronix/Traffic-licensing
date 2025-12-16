import { Routes } from '@angular/router';
import { LprRequest } from './Features/lpr-request/lpr-request';
import { ArchiveComponent } from './Features/archive-component/archive-component';

export const routes: Routes = [
  { path: '', redirectTo: 'lpr', pathMatch: 'full' },
  { path: 'lpr', component: LprRequest },
  { path: 'archive', component: ArchiveComponent },
];
