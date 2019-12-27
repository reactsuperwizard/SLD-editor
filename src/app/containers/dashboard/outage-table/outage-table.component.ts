import {Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output} from '@angular/core';
import { AddEditOutageTypeComponent } from '../modals/add-edit-outage-type/add-edit-outage-type.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as uuid from 'uuid';
import * as _ from 'lodash';
import { DeleteAlertModalComponent } from '../modals/delete-alert-modal/delete-alert-modal.component';

@Component({
  selector: 'app-outage-table',
  templateUrl: './outage-table.component.html',
  styleUrls: ['./outage-table.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OutageTableComponent implements OnInit {
  filterShow = false;
  selected = [];
  @Input() periocidy = [];
  @Input() data = [];
  localData: any = [];
  @Output() clear = new EventEmitter();
  filterColumns = [
    { prop: 'type', name: 'Type', selected: true },
    { prop: 'duration', name: 'Duration / Hours', selected: true },
    { prop: 'period', name: 'Periocidy / Months', selected: true }
  ];

  constructor(private modalService: NgbModal) { }

  ngOnInit() {
    this.localData = [...this.data];
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  addOrEditMember(data) {
    const modelRef = this.modalService.open(AddEditOutageTypeComponent, {
      centered: true,
      size: 'lg',
    });
    modelRef.componentInstance.data = data || {};
    modelRef.componentInstance.periocidy = this.periocidy || [];
    modelRef.result.then(res => {
      if (res.type === 'save') {
        if (data) {
          let index = this.localData.indexOf(data);
          if (index >= 0) {
            this.localData.splice(index, 1, res.data);
          }
          index = this.selected.indexOf(data);
          if (index >= 0) {
            this.selected.splice(index, 1, res.data);
          }
          this.selected = [...this.selected];
          this.localData = [...this.localData];
        } else {
          res.data.id = uuid.v1();
          this.localData.push(res.data);
          this.localData = [...this.localData];
        }
      }
    }, () => {
    });
  }

  delete() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, { centered: true });
    modalRef.componentInstance.deleteItemName = 'Outage type';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.localData = _.difference(this.localData, this.selected);
        this.selected = [];
      }
    }, () => { });
  }

  reset() {
    this.clear.emit();
  }
}
