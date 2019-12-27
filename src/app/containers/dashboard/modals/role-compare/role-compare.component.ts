import { Component, OnInit, Input } from '@angular/core';
import { ApplicationService } from 'src/services/application.service';
import * as _ from 'lodash';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BackWithoutSaveAlertModalComponent } from '../back-without-save-alert-modal/back-without-save-alert-modal.component';

@Component({
  selector: 'app-role-compare',
  templateUrl: './role-compare.component.html',
  styleUrls: ['./role-compare.component.scss']
})
export class RoleCompareComponent implements OnInit {

  @Input() rolesInput: Array<Object> = [];
  roles = [];
  allPermissions: any;
  roleData: any;

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal, private modalService: NgbModal) { }

  ngOnInit() {
    this.roles = _.cloneDeep(this.rolesInput);
    this.buildDataForDisplay();
  }

  buildDataForDisplay() {
    this.allPermissions = {};

    this.roles.forEach(role => {
      role['rolePrivileges'].forEach(privilege => {
        if (this.allPermissions[privilege.permissionName]) {
          this.allPermissions[privilege.permissionName] = this.allPermissions[privilege.permissionName]
            .concat(privilege.permissionList.map(item => item.name));
        } else {
          this.allPermissions[privilege.permissionName] = privilege.permissionList.map(item => item.name);
        }
      });
    });

    Object.keys(this.allPermissions).forEach(key => {
      this.allPermissions[key] = _.uniq(this.allPermissions[key]);
    });

    this.allPermissions = Object.keys(this.allPermissions)
      .map(key => ({ name: key, items: this.allPermissions[key] }));

    this.roleData = this.roles.map(role => {
      const ret = { roleName: role['roleName'] };
      ret['permissions'] = [];

      this.allPermissions.forEach(permission => {
        const privilege = _.find(role['rolePrivileges'], pri => pri.permissionName === permission.name);
        if (privilege) {
          const list = permission.items.map(item => {
            const existPermission = _.find(privilege['permissionList'], per => per.name === item);
            return existPermission ? existPermission : { disabled: true };
          });
          ret['permissions'].push({ name: permission.name, enabled: privilege.enabled, list: list });
        } else {
          const list = permission.items.map(item => {
            return { disabled: true };
          });
          ret['permissions'].push({ name: permission.name, enabled: false, list: [] });

        }
      });

      return ret;
    });
  }


  backWithoutSave() {
    if (JSON.stringify(this.roles) !== JSON.stringify(this.rolesInput)) {
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
    this.activeModal.close(this.roles);
  }
}
