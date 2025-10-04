import { Routes } from '@angular/router';
import {LoginComponent} from './public/login/login.component';
import {SidenavComponent} from './public/sidenav/sidenav.component';
import {RegisterLoginComponent} from './public/register-login/register-login.component';

export const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterLoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'sidenav', component: SidenavComponent}

];
