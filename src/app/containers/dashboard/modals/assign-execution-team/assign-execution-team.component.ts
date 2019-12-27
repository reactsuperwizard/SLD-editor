import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApplicationService } from 'src/services/application.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-assign-execution-team',
  templateUrl: './assign-execution-team.component.html',
  styleUrls: ['./assign-execution-team.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AssignExecutionTeamComponent implements OnInit {

  allTeams = [];
  teams: Array<any> = [];
  loading = true;
  selected = [];
  filterShow = false;
  filterStr = '';
  tableVisible = false;

  filterColumns = [
    { prop: 'teamName', name: 'Name', selected: true },
    { prop: 'region', name: 'Region', selected: true },
    { prop: 'type', name: 'Type', selected: true },
    { prop: 'topSkill', name: 'Skills', selected: true },
  ];

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.appSvc.getExecutionTeams().subscribe(res => {
      this.loading = false;
      this.teams = res;
      this.allTeams = res;
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
    this.teams = this.allTeams.filter(team => {
      if (!strFilter) {
        return true;
      }
      return filterItems.some(filterItem => {
        let searchTxt = team[filterItem.prop] || '';
        if (!(team[filterItem.prop] instanceof String)) {
          searchTxt = JSON.stringify(team[filterItem.prop]);
        }
        return searchTxt.toLowerCase().indexOf(strFilter) !== -1;
      });
    });
  }

  assign() {
    this.activeModal.close(this.selected);
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  selectedItemCount() {
    return this.teams.filter(team => team['selected']).length;
  }

}
