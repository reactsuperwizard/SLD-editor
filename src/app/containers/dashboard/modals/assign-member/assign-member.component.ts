import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-assign-member',
  templateUrl: './assign-member.component.html',
  styleUrls: ['./assign-member.component.scss']
})
export class AssignMemberComponent implements OnInit {
  @ViewChild('allUsers') allUsersComponent: TemplateRef<any>;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  save() {
    this.activeModal.close(this.allUsersComponent['selected']);
  }
}
