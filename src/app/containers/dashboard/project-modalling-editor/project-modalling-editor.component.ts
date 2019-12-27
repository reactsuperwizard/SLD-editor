import { Component, OnInit } from '@angular/core';
import {ApplicationService} from '../../../../services/application.service';

@Component({
  selector: 'app-project-modalling-editor',
  templateUrl: './project-modalling-editor.component.html',
  styleUrls: ['./project-modalling-editor.component.scss']
})
export class ProjectModallingEditorComponent implements OnInit {
  loading = false;
  gis = {};
  sld = {};
  constructor(private appSvc: ApplicationService) { }

  ngOnInit() {
    this.loading = true;
    this.appSvc.getProjectModalling().subscribe(data => {
      this.gis = data.gis;
      this.sld = data.sld;
      this.loading = false;
    });
  }

}
