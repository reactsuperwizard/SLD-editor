import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ApplicationService } from '../../../../services/application.service';
import * as _ from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RoleCompareComponent } from '../modals/role-compare/role-compare.component';
import { EditRoleComponent } from '../edit-role/edit-role.component';

@Component({
  selector: 'app-all-roles',
  templateUrl: './all-roles.component.html',
  styleUrls: ['./all-roles.component.scss']
})
export class AllRolesComponent implements OnInit {
  allUsers$: Observable<any[]>;
  rolesList = [];
  roles = [];
  loading = true;

  constructor(private appSvc: ApplicationService, private router: Router, private modalService: NgbModal) { }

  ngOnInit() {
    this.appSvc.getRoles().subscribe(res => {
      this.loading = false;
      this.roles = res;
      this.rolesList = res;
    });
  }

  addOrEditRole(role: Object = null) {
    const modalRef = this.modalService.open(EditRoleComponent, {
      centered: true,
      backdrop: 'static',
      backdropClass: 'full-screen-modal-backdrop',
      windowClass: 'full-screen-modal-window'
    });

    const allPrivileges = _.uniqBy(_.flatten(this.rolesList.map(template => template.rolePrivileges)), 'permissionName');
    const dummyRole = {
      rolePrivileges: allPrivileges.map(privilege => Object.assign({}, privilege, {enabled: false}))
    };

    modalRef.componentInstance.roleInput = role || dummyRole;
    modalRef.result.then(res => {
      if (res === 'delete') {
        this.roles = this.roles.filter(rol => rol !== role);
      } else if (res instanceof Object && role) {
        const index = this.roles.indexOf(role);
        this.roles[index] = res;
      } else if (res instanceof Object) {
        this.roles.push(res);
      }
    }, () => { });
  }

  compareRoles() {
    const modalRef = this.modalService.open(RoleCompareComponent, { size: 'lg', windowClass: 'large-screen-modal-window'});
    modalRef.componentInstance.rolesInput = this.roles;
    modalRef.result.then(res => {
      if (res instanceof Array) {
        this.roles = res;
      }
    }, () => { });
  }
}
