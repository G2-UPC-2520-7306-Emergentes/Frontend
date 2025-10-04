import { Routes } from '@angular/router';
import {LoginComponent} from './public/login/login.component';
import {SidenavComponent} from './public/sidenav/sidenav.component';
import {RegisterLoginComponent} from './public/register-login/register-login.component';
import {RecoverLoginComponent} from './public/recover-login/recover-login.component';
import {DetailsBatchComponent} from './Foodchain/components/details-batch/details-batch.component';
export const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterLoginComponent },
  { path: 'recover-password', component: RecoverLoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'sidenav', component: SidenavComponent, children: [
      { path: 'details-batch', component: DetailsBatchComponent },
    ]}

];
