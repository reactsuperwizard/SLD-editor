import {Component, OnInit} from '@angular/core';
import {ApplicationService} from 'src/services/application.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit {
  loading = true;
  listView = true;
  allProjects: any;
  filteredData: any;
  filterShow = false;
  filterColumns = [
    {prop: 'company', name: 'Company', selected: true},
    {prop: 'location', name: 'Location', selected: true},
    {prop: 'manager', name: 'Member', selected: true},
    {prop: 'kernelVersion', name: 'Kernel Version', selected: true},
    {prop: 'commercialScope', name: 'Commercial Scope', selected: true}
  ];

  constructor(private appSvc: ApplicationService,
              private router: Router) {
  }

  ngOnInit() {
    this.appSvc.getAllProjects().subscribe(res => {
      this.loading = false;
      this.allProjects = res;
      this.filteredData = res;
    });
  }

  updateFilter(event) {
    const val = event.target.value.toLowerCase();
    // filter our data
    const cols = ['company', 'location', 'manager', 'kernelVersion', 'commercialScope'];
    // assign filtered matches to the active datatable
    this.filteredData = this.allProjects.filter(function (item) {
      // iterate through each row's column data
      for (let i = 0; i < cols.length; i++) {
        // check for a match
        if (item[cols[i]].toString().toLowerCase().indexOf(val) !== -1 || !val) {
          // found match, return true to add to result set
          return true;
        }
      }
    });
  }

  onActivate(event) {
    if (event.type === 'click') {
      this.router.navigateByUrl(`/dashboard/project/${event.row.projectId}`);
    }
  }
}
