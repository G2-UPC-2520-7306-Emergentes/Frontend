import { Routes } from '@angular/router';
import {LoginComponent} from './public/login/login.component';
import {SidenavComponent} from './public/sidenav/sidenav.component';
import {RegisterLoginComponent} from './public/register-login/register-login.component';
import {RecoverLoginComponent} from './public/recover-login/recover-login.component';
import {DetailsBatchComponent} from './Foodchain/components/details-batch/details-batch.component';
import {DuplicateBatchComponent} from './Foodchain/components/duplicate-batch/duplicate-batch.component';
import {ViewBatchComponent} from './Foodchain/components/view-batch/view-batch.component';
import {EditBatchComponent} from './Foodchain/components/edit-batch/edit-batch.component';
import {EditAdminComponent} from './Foodchain/components/users/edit-admin/edit-admin.component';
import {NewUserAdminComponent} from './Foodchain/components/users/newuser-admin/newuser-admin.component';
export const routes: Routes = [

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterLoginComponent },
  { path: 'recover-password', component: RecoverLoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'sidenav', component: SidenavComponent, children: [
      { path: 'details-batch', component: DetailsBatchComponent },
      { path: 'duplicate-batch', component: DuplicateBatchComponent },
      { path: 'view-batch', component: ViewBatchComponent },
      { path: 'edit-batch', component: EditBatchComponent },
      { path: 'edit-admin', component: EditAdminComponent },
      { path: 'newuser-admin', component: NewUserAdminComponent },
    ]}

];
