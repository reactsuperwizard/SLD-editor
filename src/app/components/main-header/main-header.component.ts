import { Component, OnInit, Input } from '@angular/core';
import { UserTypeResolverService } from '../../../services/user-type-resolver.service';
import {ApplicationService} from '../../../services/application.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-main-header',
  templateUrl: './main-header.component.html',
  styleUrls: ['./main-header.component.scss']
})
export class MainHeaderComponent implements OnInit {

  public db: any = {};
  public userType: string;

  public project: any;

  @Input() showExtraInfo: boolean;

  constructor(
    private appSvc: ApplicationService, private userTypeService: UserTypeResolverService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.appSvc.get()
    .subscribe(res => {
      this.db = res;
    });

    this.userType = this.userTypeService.resolve();
    if (this.userType === 'PM') {
      this.appSvc.getAllProjects().subscribe(res => {
        this.project = res.filter(project => project.projectId === this.authService.getUser().projectId)[0];
      });
    }
  }

}
