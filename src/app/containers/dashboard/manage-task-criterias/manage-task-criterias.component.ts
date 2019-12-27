import {Component, EventEmitter, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {TaskCriteriaComponent} from '../modals/task-criteria/task-criteria.component';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import {DeleteAlertModalComponent} from '../modals/delete-alert-modal/delete-alert-modal.component';
import {ApplicationService} from '../../../../services/application.service';
import {TaskOverdueCriteriaComponent} from '../modals/task-overdue-criteria/task-overdue-criteria.component';

@Component({
  selector: 'app-manage-task-criterias',
  templateUrl: './manage-task-criterias.component.html',
  styleUrls: ['./manage-task-criterias.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ManageTaskCriteriasComponent implements OnInit {
  manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  data = {
    enableTaskRating: false,
    manageTasks: [],
    taskRatings: [],
    performanceGroups: [],
    performanceGroup: '',
    performance: 0
  };

  sliderOptions = {
    showSelectionBar: true,
    floor: 0,
    ceil: 100,
    step: 1,
  };
  sliderPerfOptions = {
    showSelectionBar: true,
    floor: 0,
    ceil: 10,
    step: 1,
  };
  selected = [];
  @Input() type = 'Opex';
  loading = false;

  constructor(private appSvc: ApplicationService, private modalService: NgbModal) {
  }

  ngOnInit() {
    this.loading = true;
    this.appSvc.getTaskCriterias(this.type).subscribe(data => {
      this.data = data;
      this.loading = false;
      setTimeout(() => {
        this.manualRefresh.emit();
      }, 1000);
    });
  }

  onSelect({selected}) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  onEnableTaskRating(e) {
    this.data.enableTaskRating = e.target.checked;
    this.manualRefresh.emit();
  }


  addOrEditMember(task) {
    const ngbModalRef = this.modalService.open(TaskCriteriaComponent, {
      centered: true,
      size: 'sm',
    });
    ngbModalRef.componentInstance.data = (task || {});
    ngbModalRef.componentInstance.title = (task ? 'Edit task criteria' : 'Add new criteria');
    ngbModalRef.result.then(res => {
      if (res.type === 'save') {
        if (!task) {
          res.data.id = uuid.v1();
          this.data.taskRatings.push(res.data);
        } else {
          const index = _.findIndex(this.data.taskRatings, {id: task.id});
          this.data.taskRatings[index].name = res.data.name;
          this.data.taskRatings[index].weight = res.data.weight;
          this.data.taskRatings[index].incremental = res.data.incremental;
        }
        this.data.taskRatings = [...this.data.taskRatings];
        this.selected = [];
        setTimeout(() => {
          this.manualRefresh.emit();
        }, 500);
      }
    }, () => {
    });
  }

  delete() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.deleteItemName = 'Task rating';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.data.taskRatings = _.difference(this.data.taskRatings, this.selected);
        this.selected = [];
      }
    }, () => {
    });
  }

  info() {
    const modalRef = this.modalService.open(TaskOverdueCriteriaComponent, {
      centered: true,
      size: 'lg',
      windowClass: 'large-screen-modal-window'
    });
    modalRef.result.then(ret => {
    }, () => {
    });
  }
}
