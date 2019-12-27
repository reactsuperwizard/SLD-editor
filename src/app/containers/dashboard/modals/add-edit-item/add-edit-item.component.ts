import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, Validators } from '@angular/forms';
import { DeleteAlertModalComponent } from '../delete-alert-modal/delete-alert-modal.component';
import { BackWithoutSaveAlertModalComponent } from '../back-without-save-alert-modal/back-without-save-alert-modal.component';

@Component({
  selector: 'app-add-edit-item',
  templateUrl: './add-edit-item.component.html',
  styleUrls: ['./add-edit-item.component.scss']
})
export class AddEditItemComponent implements OnInit {

  @Input() title: string;
  @Input() disableDelete: boolean;
  @Input() data: Object = {};
  name = new FormControl('', Validators.required);

  constructor(public activeModal: NgbActiveModal, private modalService: NgbModal) { }

  ngOnInit() {
    if (this.data) {
      this.name.setValue(this.data['name']);
    }
  }

  save() {
    if (this.data) {
      this.data['name'] = this.name.value;
    } else {
      this.data = {
        name: this.name.value
      };
    }
    this.activeModal.close(this.data);
  }

  delete() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, { centered: true });
    modalRef.componentInstance.deleteItemName = 'knowledge bank category';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.activeModal.close('delete');
      }
    }, () => { });
  }

  backWithoutSave() {
    if ((!this.data && this.name.value) || (this.data && this.data['name'] !== this.name.value)) {
      this.modalService.open(BackWithoutSaveAlertModalComponent, { centered: true }).result.then(ret => {
        if (ret === 'leave') {
          this.activeModal.dismiss('back');
        }
      }, () => { });
    } else {
      this.activeModal.dismiss('back');
    }
  }
}
