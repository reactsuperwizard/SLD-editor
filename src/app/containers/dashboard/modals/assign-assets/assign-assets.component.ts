import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-assign-assets',
  templateUrl: './assign-assets.component.html',
  styleUrls: ['./assign-assets.component.scss']
})
export class AssignAssetsComponent implements OnInit {
  @ViewChild('allAssets') allAssetsComponent: TemplateRef<any>;

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
  }

  save() {
    this.activeModal.close(this.allAssetsComponent['selected']);
  }
}
