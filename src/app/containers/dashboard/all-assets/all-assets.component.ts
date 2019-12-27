import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ApplicationService} from '../../../../services/application.service';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-all-assets',
  templateUrl: './all-assets.component.html',
  styleUrls: ['./all-assets.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AllAssetsComponent implements OnInit {
  loading = true;
  allUsers = [];
  allUsersList = [];
  selected = [];
  filterShow = false;
  filterStr = '';
  page = {totalElements: 0, pageNumber: 0, size: PAGE_SIZE};
  @Input() asModal = false;
  tableVisible = false;

  filterColumns = [
    {prop: 'refId', name: 'Reference', selected: true},
    {prop: 'region', name: 'Region', selected: true},
    {prop: 'type', name: 'Type', selected: true},
    {prop: 'tech', name: 'Tech', selected: true},
    {prop: 'manufacture', name: 'Manufact', selected: true},
    {prop: 'model', name: 'Model', selected: true},
    {prop: 'risk', name: 'Risk', selected: true}
  ];
  filterOption = 'Alphabetic';
  masterData = {
    filterOptions: []
  };

  constructor(private appSvc: ApplicationService, private modalService: NgbModal) {
  }

  ngOnInit() {
    this.appSvc.getMasterData()
      .subscribe((data) => {
        this.masterData = data;
      }, (error) => {
      });
    this.appSvc.getAssets(this.page.size, this.page.pageNumber).subscribe(res => {
      this.loading = false;
      this.page.totalElements = res.totalElements;
      this.allUsersList = res.data;
      this.allUsers = res.data;
      // make the table relayout, otherwize sometimes its layout is wrong
      setTimeout(() => {
        this.tableVisible = true;
      }, 0);
    });
  }

  updateFilter() {
    const strFilter = this.filterStr.trim().toLowerCase();
    let filterItems = this.filterColumns.filter(filterItem => filterItem.selected);
    if (filterItems.length === 0) {
      filterItems = this.filterColumns;
    }
    // filter our data
    this.page.pageNumber = 0;
    this.appSvc.getAssets(this.page.size, this.page.pageNumber, strFilter, filterItems).subscribe(res => {
      this.loading = false;
      this.page.totalElements = res.totalElements;
      this.allUsersList = res.data;
      this.allUsers = res.data;
    });
  }

  onSelect({selected}) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }


  setPage($event) {
    const strFilter = this.filterStr.trim().toLowerCase();
    this.page.pageNumber = $event.offset;
    this.loading = true;
    let filterItems = this.filterColumns.filter(filterItem => filterItem.selected);
    if (filterItems.length === 0) {
      filterItems = this.filterColumns;
    }
    this.appSvc.getAssets(this.page.size, this.page.pageNumber, strFilter, filterItems).subscribe(res => {
      this.loading = false;
      this.page.totalElements = res.totalElements;
      this.allUsersList = res.data;
      this.allUsers = res.data;
    });
  }
}
