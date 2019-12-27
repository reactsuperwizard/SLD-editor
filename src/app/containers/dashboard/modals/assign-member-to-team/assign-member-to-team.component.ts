import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-assign-member-to-team',
  templateUrl: './assign-member-to-team.component.html',
  styleUrls: ['./assign-member-to-team.component.scss']
})
export class AssignMemberToTeamComponent implements OnInit {

  @ViewChild('allUsers') allUsersComponent: TemplateRef<any>;

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

  save() {
    this.activeModal.close(this.allUsersComponent['selected']);
  }
}
