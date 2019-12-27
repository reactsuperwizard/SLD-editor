import { Component, OnInit } from '@angular/core';
import { ApplicationService } from 'src/services/application.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-all-privileges',
  templateUrl: './all-privileges.component.html',
  styleUrls: ['./all-privileges.component.scss'],
})
export class AllPrivilegsComponent implements OnInit {

  roles: Array<any> = [];
  privileges: any;
  loading = true;

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.appSvc.getRoles().subscribe(res => {
      this.loading = false;
      this.roles = res;
      this.privileges = this.roles[0].rolePrivileges;
    });
  }

  save() {
    this.activeModal.close(this.roles.filter(role => role['selected']));
  }

  selectedItemCount() {
    return this.roles.filter(role => role['selected']).length;
  }
}
