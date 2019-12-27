import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';
import * as _ from 'lodash';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BackWithoutSaveAlertModalComponent } from '../modals/back-without-save-alert-modal/back-without-save-alert-modal.component';
import { DeleteAlertModalComponent } from '../modals/delete-alert-modal/delete-alert-modal.component';

@Component({
  selector: 'app-edit-role',
  templateUrl: './edit-role.component.html',
  styleUrls: ['./edit-role.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditRoleComponent implements OnInit {
  allUsers = [];
  rolesList = [];
  submitted = false;
  @Input() roleInput: Object = null;
  role = null;
  title = '';

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal, private modalService: NgbModal) { }


  ngOnInit() {
    this.title = (this.roleInput && this.roleInput['roleName']) ? 'Edit role' : 'Create new role';
    this.role = this.roleInput ? _.cloneDeep(this.roleInput) : {};
  }

  backWithoutSave() {
    if (JSON.stringify(this.role) !== JSON.stringify(this.roleInput)) {
      this.modalService.open(BackWithoutSaveAlertModalComponent, { centered: true }).result.then(ret => {
        if (ret === 'leave') {
          this.activeModal.dismiss('back');
        }
      }, () => { });
    } else {
      this.activeModal.dismiss('back');
    }
  }

  validateForm() {
    return this.role['roleName'];
  }

  save() {
    this.submitted = true;
    if (!this.validateForm()) {
      return;
    }
    this.activeModal.close(this.role);
  }

  delete() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, { centered: true });
    modalRef.componentInstance.deleteItemName = 'role';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.activeModal.close('delete');
      }
    }, () => { });
  }
}
