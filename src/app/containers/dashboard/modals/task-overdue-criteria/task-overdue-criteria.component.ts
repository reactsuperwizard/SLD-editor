import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-task-overdue-criteria',
  templateUrl: './task-overdue-criteria.component.html',
  styleUrls: ['./task-overdue-criteria.component.scss']
})
export class TaskOverdueCriteriaComponent implements OnInit {

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }

}
