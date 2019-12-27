import {Component, OnInit} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ApplicationService} from '../../../../services/application.service';
import {DeleteAlertModalComponent} from '../modals/delete-alert-modal/delete-alert-modal.component';
import {AddEditItemComponent} from '../modals/add-edit-item/add-edit-item.component';

@Component({
  selector: 'app-skills',
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent implements OnInit {
  loading = false;
  customisedSkills: Array<any> = [];
  defaultSkills: Array<any> = [];

  constructor(private appSvc: ApplicationService,
              private modalService: NgbModal) {
  }

  ngOnInit() {
    this.loading = true;
    this.appSvc.getAllSkills().subscribe(skill => {
      this.loading = false;
      this.customisedSkills = skill.customisedSkills;
      this.defaultSkills = skill.defaultSkills;
    });
  }

  getSkillsSelectedCount() {
    return this.customisedSkills.filter(item => item.selected).length;
  }

  addNewSkill(item: Object = null) {
    const modalRef = this.modalService.open(AddEditItemComponent, {centered: true});
    let title = item ? 'Edit ' : 'Add new ';
    title = title + 'Skill';
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.data = item;
    modalRef.componentInstance.disableDelete = true;
    modalRef.result.then(ret => {
      if (!item) {
        this.customisedSkills.push(ret);
      }
    }, () => {
    });
  }

  editSelectedSkill() {
    const selectedItems = this.customisedSkills.filter(item => item.selected);
    if (selectedItems.length > 0) {
      this.addNewSkill(selectedItems[0]);
    }
  }

  deleteSkill() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.deleteItemName = 'customised skills';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.customisedSkills = this.customisedSkills.filter(item => !item.selected);
      }
    }, () => {
    });
  }
}
