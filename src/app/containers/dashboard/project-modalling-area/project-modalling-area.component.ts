import {Component, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ApplicationService} from '../../../../services/application.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AssignAssetsComponent} from '../modals/assign-assets/assign-assets.component';
import * as _ from 'lodash';
import {DeleteAlertModalComponent} from '../modals/delete-alert-modal/delete-alert-modal.component';
import {AddEditAreaComponent} from '../modals/add-edit-area/add-edit-area.component';

@Component({
  selector: 'app-project-modalling-area',
  templateUrl: './project-modalling-area.component.html',
  styleUrls: ['./project-modalling-area.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProjectModallingAreaComponent implements OnInit {
  @ViewChild('outageTable') table: any;
  rows: any = [];
  @Input() type = 'Outage';
  @Input() title = 'Manage outage areas';
  @Input() placeholder = 'BA-TYPE';
  loading = false;
  filterColumns = [
    {prop: 'refId', name: 'Reference', selected: true},
    {prop: 'region', name: 'Region', selected: true},
    {prop: 'type', name: 'Type', selected: true},
    {prop: 'tech', name: 'Tech', selected: true},
    {prop: 'manufacture', name: 'Manufact', selected: true},
    {prop: 'model', name: 'Model', selected: true},
    {prop: 'risk', name: 'Risk', selected: true}
  ];

  constructor(private appSvc: ApplicationService,
              private modalService: NgbModal) {
  }

  ngOnInit() {
    this.loading = true;
    this.appSvc.getProjectModallingArea(this.type).subscribe(data => {
      this.rows = [...data.rows];
      this.loading = false;
    });
  }

  deleteGroup(groupIndex) {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.deleteItemName = this.type + ' area';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.rows.splice(groupIndex, 1);
        this.rows = [...this.rows];
      }
    }, () => {
    });
  }

  deleteAll() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.deleteItemName = 'all outages';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.rows = [];
      }
    }, () => {
    });
  }

  deleteAsset(groupIndex, row) {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.message = 'Are you sure to remove the asset from group';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.rows[groupIndex].items = _.reject(this.rows[groupIndex].items, {refId: row.refId});
        this.rows = [...this.rows];
      }
    }, () => {
    });
  }

  assignAsset(groupIndex) {
    this.modalService.open(AssignAssetsComponent, {
      centered: true,
      size: 'lg',
      windowClass: 'large-screen-modal-window'
    }).result.then(res => {
      if (res instanceof Array) {
        _.each(res, (item, i) => {
          this.rows[groupIndex].items.push(item);
        });
        this.rows[groupIndex].items = [...this.rows[groupIndex].items];
        this.rows = [...this.rows];
      }
    }, () => {
    });
  }

  addNewGroup() {
    const ngbModalRef = this.modalService.open(AddEditAreaComponent, {
      centered: true,
      size: 'sm',
    });
    ngbModalRef.componentInstance.placeholder = this.placeholder;
    ngbModalRef.componentInstance.type = this.type;
    ngbModalRef.result.then((res: any) => {
      if (res.type === 'save') {
        res.data.items = [];
        this.rows.push(res.data);
        this.rows = [...this.rows];
      }
    }, () => {
    });
  }

  saveEdit(group) {
    this.rows = _.map(this.rows, (row) => {
      if (row.areaId === group.key) {
        row.edit = false;
        row.areaId = group.value[0].editAreaId;
        row.description = group.value[0].editDescription;
      }
      return row;
    });
  }

  edit(groupIndex, group) {
    const ngbModalRef = this.modalService.open(AddEditAreaComponent, {
      centered: true,
      size: 'sm',
    });
    ngbModalRef.componentInstance.placeholder = this.placeholder;
    ngbModalRef.componentInstance.type = this.type;
    ngbModalRef.componentInstance.data = {
      areaId: group.areaId,
      description: group.description,
    };
    ngbModalRef.result.then((res: any) => {
      if (res.type === 'save') {
        this.rows[groupIndex].areaId = res.data.areaId;
        this.rows[groupIndex].description = res.data.description;
        this.rows = [...this.rows];
      }
    }, () => {
    });
  }

}
