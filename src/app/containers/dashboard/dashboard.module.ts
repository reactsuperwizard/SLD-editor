import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NumberOnlyDirective } from '../../directive/number.directive';
import { CreateUserComponent } from './create-user/create-user.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { ViewUserComponent } from './view-user/view-user.component';
import { AllUserComponent } from './all-users/all-users.component';
import { AllRolesComponent } from './all-roles/all-roles.component';
import { EditExecTeamComponent } from './edit-exec-team/edit-exec-team.component';
import { AllExeuTeamsComponent } from './all-exeu-teams/all-exeu-teams.component';
import { DashboardComponent } from './dashboard.component';
import { dashboardRoutes } from './dashboard.routing';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { NgSelectModule } from '@ng-select/ng-select';
import { Ng5SliderModule } from 'ng5-slider';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { DragAndDropModule } from 'angular-draggable-droppable';
import { ProjectListComponent } from './project-list/project-list.component';
import { ProjectEntityComponent } from './project-entity/project-entity.component';
import { NgbTabsetModule } from '@ng-bootstrap/ng-bootstrap';
import { RiskMatrixComponent } from '../../components/risk-matrix/risk-matrix.component';
import { MemberPrivilegeComponent } from './member-privilege/member-privilege.component';
import { TaskCriteriasComponent } from './task-criterias/task-criterias.component';
import { ManageKernelComponent } from './manage-kernel/manage-kernel.component';
import { AddEditItemComponent } from './modals/add-edit-item/add-edit-item.component';
import { ThreeStateSlideSelectComponent } from 'src/app/components/three-state-slide-select/three-state-slide-select.component';
import { EditRoleComponent } from './edit-role/edit-role.component';
import { NewRoleTemplateComponent } from './modals/new-role-template/new-role-template.component';
import { RoleCompareComponent } from './modals/role-compare/role-compare.component';
import { AssignMemberToTeamComponent } from './modals/assign-member-to-team/assign-member-to-team.component';
import { DeleteAlertModalComponent } from './modals/delete-alert-modal/delete-alert-modal.component';
import { BackWithoutSaveAlertModalComponent } from './modals/back-without-save-alert-modal/back-without-save-alert-modal.component';
import { AssignMemberComponent } from './modals/assign-member/assign-member.component';
import { OutageTypeComponent } from './outage-type/outage-type.component';
import { OutageTableComponent } from './outage-table/outage-table.component';
import { AddEditOutageTypeComponent } from './modals/add-edit-outage-type/add-edit-outage-type.component';
import { ProjectModallingComponent } from './project-modalling/project-modalling.component';
import { ProjectModallingEditorComponent } from './project-modalling-editor/project-modalling-editor.component';
import { ProjectModallingAreaComponent } from './project-modalling-area/project-modalling-area.component';
import { AllAssetsComponent } from './all-assets/all-assets.component';
import { AssignAssetsComponent } from './modals/assign-assets/assign-assets.component';
import { ManageTaskCriteriasComponent } from './manage-task-criterias/manage-task-criterias.component';
import { TaskCriteriaComponent } from './modals/task-criteria/task-criteria.component';
import { TaskOverdueCriteriaComponent } from './modals/task-overdue-criteria/task-overdue-criteria.component';
import { AllPrivilegsComponent } from './modals/all-privileges/all-privileges.component';
import { RoleCardComponent } from './components/role-card/role-card.component';
import { AssignExecutionTeamComponent } from './modals/assign-execution-team/assign-execution-team.component';
import { EditSkillComponent } from './modals/edit-skill/edit-skill.component';
import { ReliabilityCenterComponent } from './reliability-center/reliability-center.component';
import { ReliabilityOverviewComponent } from './reliability-overview/reliability-overview.component';
import { ReliabilityWorkspaceComponent } from './reliability-workspace/reliability-workspace.component';
import { PositiveNumberOnlyDirective } from '../../directive/positiveNumber.directive';
import { AddEditAreaComponent } from './modals/add-edit-area/add-edit-area.component';
import { SkillsComponent } from './skills/skills.component';
import {AddNewComponent} from '../../components/add-new/add-new.component';
import {AddEditProjectComponent} from './add-edit-project/add-edit-project.component';
import {MemberComponent} from '../../components/member/member.component';
import {PERFECT_SCROLLBAR_CONFIG, PerfectScrollbarConfigInterface, PerfectScrollbarModule} from 'ngx-perfect-scrollbar';

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
};

@NgModule({
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ],
  imports: [
    PerfectScrollbarModule,
    CommonModule,
    CarouselModule,
    FormsModule,
    NgSelectModule,
    Ng5SliderModule,
    NgxDatatableModule,
    DragAndDropModule,
    NgbTabsetModule,
    ReactiveFormsModule,
    RouterModule.forChild(dashboardRoutes)
  ],
  entryComponents: [
    TaskOverdueCriteriaComponent,
    TaskCriteriaComponent,
    AddEditItemComponent,
    RoleCompareComponent,
    NewRoleTemplateComponent,
    AssignMemberToTeamComponent,
    EditUserComponent,
    DeleteAlertModalComponent,
    AssignMemberComponent,
    AddEditOutageTypeComponent,
    AssignAssetsComponent,
    BackWithoutSaveAlertModalComponent,
    AllPrivilegsComponent,
    AssignExecutionTeamComponent,
    EditSkillComponent,
    AddEditAreaComponent
  ],
  declarations: [
    MemberComponent,
    AddEditProjectComponent,
    NumberOnlyDirective,
    PositiveNumberOnlyDirective,
    CreateUserComponent,
    EditUserComponent,
    ViewUserComponent,
    DashboardComponent,
    AllUserComponent,
    AllRolesComponent,
    EditRoleComponent,
    AllExeuTeamsComponent,
    EditExecTeamComponent,
    ProjectListComponent,
    ProjectEntityComponent,
    RiskMatrixComponent,
    AddNewComponent,
    MemberPrivilegeComponent,
    TaskCriteriasComponent,
    ManageKernelComponent,
    AddEditItemComponent,
    ThreeStateSlideSelectComponent,
    NewRoleTemplateComponent,
    RoleCompareComponent,
    AssignMemberToTeamComponent,
    DeleteAlertModalComponent,
    BackWithoutSaveAlertModalComponent,
    AssignMemberComponent,
    OutageTypeComponent,
    OutageTableComponent,
    AddEditOutageTypeComponent,
    ProjectModallingComponent,
    ProjectModallingEditorComponent,
    ProjectModallingAreaComponent,
    AllAssetsComponent,
    AssignAssetsComponent,
    ManageTaskCriteriasComponent,
    TaskCriteriaComponent,
    TaskOverdueCriteriaComponent,
    RoleCardComponent,
    AllPrivilegsComponent,
    AssignExecutionTeamComponent,
    EditSkillComponent,
    ReliabilityCenterComponent,
    ReliabilityOverviewComponent,
    ReliabilityWorkspaceComponent,
    AddEditAreaComponent,
    SkillsComponent,
  ]
})
export class DashboardModule { }
