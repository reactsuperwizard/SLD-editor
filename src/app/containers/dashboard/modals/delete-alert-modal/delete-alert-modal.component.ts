import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-delete-alert-modal',
  templateUrl: './delete-alert-modal.component.html',
  styleUrls: ['./delete-alert-modal.component.scss']
})
export class DeleteAlertModalComponent implements OnInit {

  @Input() deleteItemName: string;
  @Input() message = '';

  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
  }
}
