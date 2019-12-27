import { Component, OnInit, Input } from '@angular/core';
import { ApplicationService } from 'src/services/application.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-new-role-template',
  templateUrl: './new-role-template.component.html',
  styleUrls: ['./new-role-template.component.scss']
})
export class NewRoleTemplateComponent implements OnInit {

  roles: Array<Object> = [];
  loading = true;
  @Input() title = 'Create new role';

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.appSvc.getRoles().subscribe(res => {
      this.loading = false;
      this.roles = res;
    });
  }

  save() {
    this.activeModal.close(this.roles.filter(role => role['selected']));
  }

  selectedItemCount() {
    return this.roles.filter(role => role['selected']).length;
  }
}
