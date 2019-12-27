import { Routes } from '@angular/router';
import { AllUserComponent } from '../../containers/dashboard/all-users/all-users.component';
import { AllRolesComponent } from '../../containers/dashboard/all-roles/all-roles.component';
import { AllExeuTeamsComponent } from './all-exeu-teams/all-exeu-teams.component';
import { EditExecTeamComponent } from './edit-exec-team/edit-exec-team.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectEntityComponent } from './project-entity/project-entity.component';
import { MemberPrivilegeComponent } from './member-privilege/member-privilege.component';
import { TaskCriteriasComponent } from './task-criterias/task-criterias.component';
import { ManageKernelComponent } from './manage-kernel/manage-kernel.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { CreateUserProfileComponent } from 'src/app/components/create-user-profile/create-user-profile.component';
import { UserTypeResolverService } from 'src/services/user-type-resolver.service';
import {AuthService as AuthGuard} from '../../../services/auth.service';
import {AddEditProjectComponent} from './add-edit-project/add-edit-project.component';
import {ProjectModallingComponent} from './project-modalling/project-modalling.component';
import {ReliabilityCenterComponent} from './reliability-center/reliability-center.component';

export const dashboardRoutes: Routes = [
  {
    path: '', component: ProjectListComponent,
    data: { title: 'All projects' },
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'reliability-center', component: ReliabilityCenterComponent,
    data: { title: 'Reliability center' },
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'create-project',
    component: AddEditProjectComponent,
    data: { title: 'Login' },
    canActivate: [AuthGuard],
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'project/:id',
    component: AddEditProjectComponent,
    data: { title: 'Login' },
    canActivate: [AuthGuard],
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'project-entities', component: ProjectEntityComponent,
    data: { title: 'Settings' },
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'project-modelling', component: ProjectModallingComponent,
    data: { title: 'Settings' },
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'members-privileges', component: MemberPrivilegeComponent,
    data: { title: 'Settings'},
    resolve: {
      userType: UserTypeResolverService,
    }
  },
  {
    path: 'task-criterias', component: TaskCriteriasComponent
  },
  {
    path: 'manage-kernel', component: ManageKernelComponent
  },
  {
    path: 'allUsers', component: AllUserComponent
  },
  {
    path: 'allRoles', component: AllRolesComponent
  },
  {
    path: 'editRole', component: EditRoleComponent
  },
  { path: 'createRole', component: CreateUserProfileComponent },
  { path: 'allExecution', component: AllExeuTeamsComponent },
  { path: 'editExecution', component: EditExecTeamComponent },
  { path: 'editExecution/:teamId', component: EditExecTeamComponent }
];
