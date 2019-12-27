import { Component, OnInit, ViewEncapsulation, Input, ViewChild, ElementRef } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';
import { UserTypeResolverService } from '../../../../services/user-type-resolver.service';
import * as _ from 'lodash';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewRoleTemplateComponent } from '../modals/new-role-template/new-role-template.component';
import { AllPrivilegsComponent } from '../modals/all-privileges/all-privileges.component';
import { AssignExecutionTeamComponent } from '../modals/assign-execution-team/assign-execution-team.component';
import { BackWithoutSaveAlertModalComponent } from '../modals/back-without-save-alert-modal/back-without-save-alert-modal.component';
import { EditSkillComponent } from '../modals/edit-skill/edit-skill.component';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditUserComponent implements OnInit {
  title = '';
  @Input() mode: 'full-screen' | 'as-modal' = 'full-screen';
  @Input() memberInput = null;
  member = {};
  addNewUser = false;
  loading = false;
  allRoles: any = [];
  userType: string;
  defaultHourlyRate: string;
  selectedSkills = [];
  hourlyRateMissing = false;
  isFormValid = true;
  submitted  = false;
  showMaintenanceInfo = false;
  @ViewChild('avatarInput') avatarInputRef: ElementRef;

  constructor(
    private appSvc: ApplicationService, public activeModal: NgbActiveModal,
    private modalService: NgbModal, private userTypeResolverService: UserTypeResolverService
  ) { }

  ngOnInit() {
    this.title = this.memberInput ? 'Edit member' : 'Add new member';
    this.member = this.memberInput ? _.cloneDeep(this.memberInput) : {};
    this.addNewUser = !this.memberInput;
    if (this.addNewUser) {
      this.loading = true;
      this.appSvc.getRoles().subscribe(res => {
        this.loading = false;
        this.allRoles = res.map(role => Object.assign({ selected: false }, role));
      });
    }
    this.userType = this.userTypeResolverService.resolve();
    this.validateForm();
  }

  checkMaintenanceInfoVisbility() {
    this.showMaintenanceInfo = !this.addNewUser && this.userType === 'PM' &&
      this.member['role'].filter(role => role === 'Maintenance Technician').length &&
      this.member['role'].filter(role => role === 'Execution Team lead').length;
  }

  validateForm() {
    this.checkMaintenanceInfoVisbility();

    this.hourlyRateMissing = this.member['executionTeams']
      && !this.member['executionTeams'].reduce((acc, team) => acc && team.hourlyRate, true);
    this.isFormValid = this.member['userName'] && this.member['surName'] &&
      this.member['employer'] && this.member['jobPosition'] &&
      (this.isEmail(this.member['email'])) && (this.isPhone(this.member['phone']))
      && (!this.showMaintenanceInfo || this.member['executionTeams'].reduce((acc, team) => acc && team.hourlyRate, true))
      && this.allRoles.filter((item) => item.selected).length > 0;
    return this.isFormValid;
  }

  isNoRoleSelected() {
    return this.submitted && this.allRoles.filter((item) => item.selected).length === 0;
  }
  isEmail(str) {
    return /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/.test(str);
  }

  isPhone(str) {
    return /^\d{1,}$/.test(str);
  }

  assignNewRole() {
    const modalComponent = this.userType === 'PM' ? AllPrivilegsComponent : NewRoleTemplateComponent;
    const modalRef = this.modalService.open(modalComponent, { centered: true, size: 'lg' });
    modalRef.componentInstance.title = 'Assign role';
    modalRef.result.then(res => {
      if (res instanceof Array) {
        const newRoles = res.map(role => role.roleName);
        if (this.member['role']) {
          this.member['role'] = _.uniq(this.member['role'].concat(newRoles));
        } else {
          this.member['role'] = _.uniq(newRoles);
        }
      }
      this.validateForm();
    }, () => { });
  }

  deleteRole(role) {
    this.member['role'].splice(this.member['role'].indexOf(role), 1);
    this.validateForm();
  }

  assignNewTeam() {
    const modalRef = this.modalService.open(AssignExecutionTeamComponent, { centered: true, size: 'lg' });
    modalRef.result.then(res => {
      if (res instanceof Array) {
        const memberTeams = this.member['executionTeams'] ? this.member['executionTeams'] : [];
        const memberTeamNames = memberTeams.map(t => t.name);
        const newTeams = res
          .filter(team => memberTeamNames.indexOf(team.teamName) === -1)
          .map(team => ({ name: team.teamName, hourlyRate: (this.defaultHourlyRate ? parseInt(this.defaultHourlyRate, 0) : null) }));
        this.member['executionTeams'] = memberTeams.concat(newTeams);
        this.validateForm();
      }
    }, () => {});
  }

  removeFromTeam(team: any) {
    this.member['executionTeams'].splice(this.member['executionTeams'].indexOf(team), 1);
    this.validateForm();
  }

  assignOrEditSkill(skill) {
    const modalRef = this.modalService.open(EditSkillComponent, { centered: true });
    modalRef.componentInstance.skillInput = skill;
    modalRef.result.then(editedSkill => {
      if (!editedSkill && !skill) { return; }
      if (!editedSkill) {
        return this.member['skills'].splice(this.member['skills'].indexOf(skill), 1);
      }
      if (!skill) {
        return this.member['skills'].push(editedSkill);
      }
      this.member['skills'][this.member['skills'].indexOf(skill)] = editedSkill;
      this.selectedSkills = this.member['skills'].filter(s => s.selected);
    }, () => {});
  }

  backWithoutSave() {
    if (JSON.stringify(this.member) !== JSON.stringify(this.memberInput)) {
      this.modalService.open(BackWithoutSaveAlertModalComponent, { centered: true }).result.then(ret => {
        if (ret === 'leave') {
          this.activeModal.dismiss('back');
        }
      }, () => { });
    } else {
      this.activeModal.dismiss('back');
    }
  }

  save() {
    this.submitted = true;
    if (this.validateForm()) {
      if (!this.member['role'] && this.allRoles.length > 0) {
        this.member['role'] = this.allRoles.filter(role => role.selected).map(role => role.roleName);
      }
      this.activeModal.close(this.member);
    }
  }

  toggleSkill(skill) {
    skill.selected = !skill.selected;
    this.selectedSkills = this.member['skills'].filter(s => s.selected);
  }

  deleteSelectedSkills() {
    this.member['skills'] = this.member['skills'].filter(skill => !skill.selected);
    this.selectedSkills = [];
  }

  addAvatar() {
    this.avatarInputRef.nativeElement.click();
  }

  onAvatarFileSelected(event) {
    const file = event.target.files[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = e => this.member['avatar'] = (e.target as any).result;
    reader.readAsDataURL(file);
  }

}
