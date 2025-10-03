import { Routes } from '@angular/router';
import {LoginComponent} from './login/login.component';
import {SidenavComponent} from './public/sidenav/sidenav.component';

export const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'sidenav', component: SidenavComponent}

];
