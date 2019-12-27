import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';
import * as _ from 'lodash';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AssignMemberToTeamComponent } from '../modals/assign-member-to-team/assign-member-to-team.component';
import { BackWithoutSaveAlertModalComponent } from '../modals/back-without-save-alert-modal/back-without-save-alert-modal.component';
import { DeleteAlertModalComponent } from '../modals/delete-alert-modal/delete-alert-modal.component';

const PAGE_SIZE = 5;
@Component({
  selector: 'app-edit-exec-team',
  templateUrl: './edit-exec-team.component.html',
  styleUrls: ['./edit-exec-team.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditExecTeamComponent implements OnInit {

  rolesList = [];
  submitted = false;
  @Input() teamInput: Object = null;
  @Input() teamType = 'Internal';
  team = null;
  title = '';
  dragIndex = -1;
  goodat = [];
  executionTasks = [];
  executionTasksSortDescOrder = true;
  page = { totalElements: 0, pageNumber: 0, size: PAGE_SIZE, pageIndexs: [] };

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal, private modalService: NgbModal) { }

  ngOnInit() {
    this.title = this.teamInput ? 'Edit execution team' : 'Create new execution team';
    this.team = this.teamInput ? _.cloneDeep(this.teamInput) : { executionTeamUsers: [], executionTasks: [], type: this.teamType };
    this.page.totalElements = this.team.executionTasks.length;
    for (let i = 0; i < Math.ceil(this.page.totalElements / this.page.size); i++) {
      this.page.pageIndexs.push(i);
    }
    this.executionTasks = _.orderBy(this.team.executionTasks, 'rating', this.executionTasksSortDescOrder ? 'desc' : 'asc')
      .slice(this.page.pageNumber * this.page.size, (1 + this.page.pageNumber) * this.page.size);
    this.updateTeamStatus();
  }

  updateFilter(event) {
    const val = event.target.value.trim().toLowerCase();

    this.executionTasks = _.orderBy(this.team.executionTasks, 'rating', this.executionTasksSortDescOrder ? 'desc' : 'asc')
      .slice(this.page.pageNumber * this.page.size, (1 + this.page.pageNumber) * this.page.size);

    // filter our data
    this.executionTasks = this.team.executionTasks.filter(t => !val || t.task.toLowerCase().indexOf(val) !== -1);
    this.executionTasks = _.orderBy(this.executionTasks, 'rating', this.executionTasksSortDescOrder ? 'desc' : 'asc')
      .slice(this.page.pageNumber * this.page.size, (1 + this.page.pageNumber) * this.page.size);
  }

  // removeExecutionTeamUser
  removeExecutionTeamUser(index) {
    this.team.executionTeamUsers.splice(index, 1);
    this.updateTeamStatus();
  }

  // onUserDrop
  onUserDrop(dropIndex: number) {
    if (this.dragIndex >= 0) {
      // swap array
      const dragOne = this.team.executionTeamUsers[this.dragIndex];
      this.team.executionTeamUsers[this.dragIndex] = this.team.executionTeamUsers[dropIndex];
      this.team.executionTeamUsers[dropIndex] = dragOne;
    }
    this.dragIndex = -1;
  }
  // onUserDragEnd
  onUserDragEnd(itemIndex) {
    this.dragIndex = itemIndex;
  }

  backWithoutSave() {
    if (JSON.stringify(this.team) !== JSON.stringify(this.teamInput)) {
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
    return this.team['teamName'] && this.team['serviceProviderName'];
  }

  save() {
    this.submitted = true;
    if (!this.validateForm()) {
      return;
    }
    this.activeModal.close(this.team);
  }

  asignMember() {
    this.modalService.open(AssignMemberToTeamComponent, {
      centered: true,
      size: 'lg',
      windowClass: 'large-screen-modal-window'
    }).result.then(res => {
      if (res instanceof Array) {
        this.team.executionTeamUsers = this.team.executionTeamUsers.concat(res.map(user => {
          user.user = user.userName;
          return user;
        }));
        this.updateTeamStatus();
      }
    }, () => { });
  }

  updateTeamStatus() {
    const goods = {};
    this.team.executionTeamUsers.forEach(user => {
      if (user.goodat instanceof Array) {
        user.goodat.forEach(ga => {
          if (goods[ga]) {
            goods[ga] = goods[ga] + 1;
          } else {
            goods[ga] = 1;
          }
        });
      }
    });

    const goodCount = {};
    Object.keys(goods).forEach(g => {
      if (goodCount[goods[g]]) {
        goodCount[goods[g]].push(g);
      } else {
        goodCount[goods[g]] = [g];
      }
    });
    this.goodat = _.orderBy(Object.keys(goodCount).map(c => ({ count: parseInt(c, 10), skills: goodCount[c] })), 'count', 'desc');
  }

  getTotalHourlyRage() {
    let netHourlyRate = 0;
    if (this.team.executionTeamUsers && this.team.executionTeamUsers.length > 0) {
      this.team.executionTeamUsers.forEach(item => {
        netHourlyRate += item.hourlyRate;
      });
    }
    return netHourlyRate;
  }

  toggleTaskSortOrder() {
    this.executionTasksSortDescOrder = !this.executionTasksSortDescOrder;
    this.executionTasks = _.orderBy(this.team.executionTasks, 'rating', this.executionTasksSortDescOrder ? 'desc' : 'asc')
      .slice(this.page.pageNumber * this.page.size, (1 + this.page.pageNumber) * this.page.size);
  }

  delete() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, { centered: true });
    modalRef.componentInstance.deleteItemName = 'team';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.activeModal.close('delete');
      }
    }, () => { });
  }

  handlePaging(pageNumber, pageOffset) {
    const newPageNumber = pageNumber + pageOffset;
    if (newPageNumber >= 0 && newPageNumber < this.page.pageIndexs.length) {
      this.page.pageNumber = newPageNumber;
    }
    this.executionTasks = _.orderBy(this.team.executionTasks, 'rating', this.executionTasksSortDescOrder ? 'desc' : 'asc')
      .slice(this.page.pageNumber * this.page.size, (1 + this.page.pageNumber) * this.page.size);
  }
}
