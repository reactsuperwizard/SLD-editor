import {Component, OnInit, ViewChild} from '@angular/core';
import {ApplicationService} from 'src/services/application.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AssignMemberComponent} from '../modals/assign-member/assign-member.component';
import {ActivatedRoute} from '@angular/router';
import {OutageTableComponent} from '../outage-table/outage-table.component';

@Component({
  selector: 'app-outage-type',
  templateUrl: './outage-type.component.html',
  styleUrls: ['./outage-type.component.scss']
})
export class OutageTypeComponent implements OnInit {
  @ViewChild(OutageTableComponent) outageTable: OutageTableComponent;
  projectOutageData: any = {
    outages: []
  };
  localProjectOutageData: any = {
    outages: []
  };
  userType: '';
  masterData = {};
  loading: boolean;

  constructor(private appSvc: ApplicationService,
              private route: ActivatedRoute,
              private modalService: NgbModal) {
  }

  ngOnInit() {
    this.userType = this.route.snapshot.data.userType;
    this.loading = true;
    this.appSvc.getMasterData().subscribe(data => {
      this.masterData = data;
    });
    this.appSvc.getProjectOutage().subscribe(data => {
      this.projectOutageData = data;
      this.localProjectOutageData = {...data};
      this.loading = false;
    });
  }

  add(field) {
    this.modalService.open(AssignMemberComponent, {
      centered: true,
      size: 'lg',
      windowClass: 'large-screen-modal-window'
    }).result.then(res => {
      if (res instanceof Array) {
        this.projectOutageData[field] = [...this.projectOutageData[field], ...res];
      }
    }, () => {
    });
  }

  clear() {
    this.projectOutageData = {...this.localProjectOutageData};
  }

  removeProjectSupport(index) {
    this.projectOutageData.projectSupports.splice(index, 1);
  }
}
