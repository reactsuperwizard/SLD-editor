import { Component, OnInit, TemplateRef, ViewChild, ViewEncapsulation, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApplicationService } from '../../../../services/application.service';
import * as _ from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditUserComponent } from '../edit-user/edit-user.component';
import { DeleteAlertModalComponent } from '../modals/delete-alert-modal/delete-alert-modal.component';

const PAGE_SIZE = 8;
@Component({
  selector: 'app-all-users',
  templateUrl: './all-users.component.html',
  styleUrls: ['./all-users.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AllUserComponent implements OnInit {
  loading = true;
  allUsers = [];
  allUsersList = [];
  selected = [];
  filterShow = false;
  filterStr = '';
  page = { totalElements: 0, pageNumber: 0, size: PAGE_SIZE };
  @Input() asModal = false;
  tableVisible = false;
  userType: string;

  filterColumns = [
    { prop: 'userName', name: 'Name', selected: true },
    { prop: 'role', name: 'Role', selected: true },
    { prop: 'employer', name: 'Employer', selected: true },
    { prop: 'executionTeams', name: 'Execution team', selected: true },
    { prop: 'email', name: 'Email', selected: true },
    { prop: 'phone', name: 'Phone', selected: true }
  ];

  temp = [];
  constructor(private appSvc: ApplicationService, private modalService: NgbModal, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.appSvc.getAllUsers(this.page.size, this.page.pageNumber).subscribe(res => {
      this.loading = false;
      this.page.totalElements = res.totalElements;
      this.allUsersList = res.data;
      this.allUsers = res.data;
      // make the table relayout, otherwize sometimes its layout is wrong
      setTimeout(() => {
        this.tableVisible = true;
      }, 0);
    });
    this.userType = this.activatedRoute.snapshot.data.userType;
  }
  updateFilter() {
    const strFilter = this.filterStr.trim().toLowerCase();
    let filterItems = this.filterColumns.filter(filterItem => filterItem.selected);
    if (filterItems.length === 0) {
      filterItems = this.filterColumns;
    }
    // filter our data
    this.allUsers = this.allUsersList.filter(user => {
      if (!strFilter) {
        return true;
      }
      return filterItems.some(filterItem => {
        let searchTxt = user[filterItem.prop] || '';
        if (!(user[filterItem.prop] instanceof String)) {
          searchTxt = JSON.stringify(user[filterItem.prop]);
        }
        return searchTxt.toLowerCase().indexOf(strFilter) !== -1;
      });
    });
  }

  addOrEditMember(member: Object = null) {
    const modalRef = this.modalService.open(EditUserComponent, member ? {
      centered: true,
      backdrop: 'static',
      backdropClass: 'full-screen-modal-backdrop',
      windowClass: 'full-screen-modal-window'
    } : {
        centered: true,
        size: 'lg',
        windowClass: 'medium-screen-modal-window'
      });
    modalRef.componentInstance.memberInput = member;
    modalRef.componentInstance.mode = member ? 'full-screen' : 'as-modal';
    modalRef.result.then(ret => {
      // add new member
      if (!member) {
        if (this.allUsersList.length >= this.page.size) {
          this.page.size ++;
        }
        this.allUsersList.push(ret);
      } else {
        let index = this.allUsersList.indexOf(member);
        if (index >= 0) {
          this.allUsersList.splice(index, 1, ret);
        }
        index = this.selected.indexOf(member);
        if (index >= 0) {
          this.selected.splice(index, 1, ret);
        }
      }
      this.updateFilter();
    }, () => { });
  }
  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  delete() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, { centered: true });
    modalRef.componentInstance.deleteItemName = 'users';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.allUsersList = _.difference(this.allUsersList, this.selected);
        this.selected = [];
        this.updateFilter();
      }
    }, () => { });
  }

  setPage($event) {
    this.page.pageNumber = $event.offset;
    this.loading = true;
    this.appSvc.getAllUsers(this.page.size, this.page.pageNumber).subscribe(res => {
      this.loading = false;
      this.page.totalElements = res.totalElements;
      this.allUsersList = res.data;
      this.allUsers = res.data;
      this.selected = [];
      this.updateFilter();
    });
  }
}
