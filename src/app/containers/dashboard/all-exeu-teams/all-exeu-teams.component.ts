import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';
import * as _ from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditExecTeamComponent } from '../edit-exec-team/edit-exec-team.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-all-exeu-teams',
  templateUrl: './all-exeu-teams.component.html',
  styleUrls: ['./all-exeu-teams.component.scss']
})
export class AllExeuTeamsComponent implements OnInit {

  loading = true;
  allExecuTeam = [];
  allExecuTeamInternal = [];
  allExecuTeamMixed = [];
  allExecuTeamExternal = [];
  modalOpen = false;
  userIsNewType = false;

  filterOpts = [
    { name: 'Alphabetic' },
    { name: 'Recent first' }
  ];

  constructor(private appSvc: ApplicationService, private modalService: NgbModal, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.userIsNewType = this.activatedRoute.snapshot.data.userType === 'new';

    this.appSvc.getExecutionTeams().subscribe(res => {
      this.loading = false;
      this.allExecuTeam = res;
      this.allExecuTeamInternal = this.allExecuTeam.filter(team => team.type.toLowerCase() === 'internal');
      this.allExecuTeamMixed = this.allExecuTeam.filter(team => team.type.toLowerCase() === 'mixed');
      this.allExecuTeamExternal = this.allExecuTeam.filter(team => team.type.toLowerCase() === 'external');
      this.updateHoulyrateAndTopskills();
    });
  }

  updateHoulyrateAndTopskills() {
    this.allExecuTeam.forEach(team => {
      if (team.executionTeamUsers && team.executionTeamUsers.length > 0) {
        team.hourlyRate = 0;
        team.executionTeamUsers.forEach(teamUser => team.hourlyRate += teamUser.hourlyRate >= 0 ? teamUser.hourlyRate : 0);
        const goods = {};
        team.executionTeamUsers.forEach(user => {
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
        team.topSkills = _.map(_.sortBy(_.toPairs(goods), item => item[1]), item => item[0]);
      }
    });
  }

  // updateFilter
  updateFilter(event, which) {
    const filterStr = event.target.value.trim().toLowerCase();
    if (which === 'internal') {
      this.allExecuTeamInternal = this.allExecuTeam
        .filter(team => team.type.toLowerCase() === 'internal' && (!filterStr || team.teamName.toLowerCase().indexOf(filterStr) >= 0));
    } else if (which === 'mixed') {
      this.allExecuTeamMixed = this.allExecuTeam
        .filter(team => team.type.toLowerCase() === 'mixed' && (!filterStr || team.teamName.toLowerCase().indexOf(filterStr) >= 0));
    } else if (which === 'external') {
      this.allExecuTeamExternal = this.allExecuTeam
        .filter(team => team.type.toLowerCase() === 'external' && (!filterStr || team.teamName.toLowerCase().indexOf(filterStr) >= 0));
    }
  }

  addOrEditExecutionTeam(teamType: String, team: Object = null) {
    const modalRef = this.modalService.open(EditExecTeamComponent, {
      centered: true,
      backdrop: 'static',
      backdropClass: 'full-screen-modal-backdrop',
      windowClass: 'full-screen-modal-window'
    });
    setTimeout(() => {
      this.modalOpen = true;
    }, 0);
    modalRef.componentInstance.teamInput = team;
    modalRef.componentInstance.teamType = teamType;
    modalRef.result.then(ret => {
      this.modalOpen = false;
      if (ret === 'delete') {
        this.allExecuTeam = this.allExecuTeam.filter(t => t !== team);
      }
      if (!team) {
        this.allExecuTeam.push(ret);
      } else {
        const index = this.allExecuTeam.indexOf(team);
        if (index >= 0) {
          this.allExecuTeam[index] = ret;
        }
      }
      this.allExecuTeamInternal = this.allExecuTeam.filter(t => t.type && t.type.toLowerCase() === 'internal');
      this.allExecuTeamMixed = this.allExecuTeam.filter(t => t.type && t.type.toLowerCase() === 'mixed');
      this.allExecuTeamExternal = this.allExecuTeam.filter(t => t.type && t.type.toLowerCase() === 'external');
      this.updateHoulyrateAndTopskills();
    }, () => {
      this.modalOpen = false;
    });
  }

}
