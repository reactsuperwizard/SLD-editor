import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { DatePipe } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';

import { HelperService } from '../services/helper.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { LoginComponent } from './containers/login/login.component';
import { MainHeaderComponent } from './components/main-header/main-header.component';
import { DashboardModule } from './containers/dashboard/dashboard.module';
import { SldEditorModule } from './containers/sld-editor/sld-editor.module';
import { MapComponent } from './containers/project-modelling/map/map.component';
import { ProjectModellingComponent } from './containers/project-modelling/project-modelling.component';
import {
  CreateSubstationModalComponent
} from './containers/project-modelling/modal/create-substation-modal/create-substation-modal.component';
import {
  CreateConnectionModalComponent
} from './containers/project-modelling/modal/create-connection-modal/create-connection-modal.component';
import { AddEditProjectComponent } from './containers/dashboard/add-edit-project/add-edit-project.component';
import { AddNewComponent } from './components/add-new/add-new.component';
import { MemberComponent } from './components/member/member.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MapComponent,
    MainHeaderComponent,
    ProjectModellingComponent,
    CreateSubstationModalComponent,
    CreateConnectionModalComponent,
  ],
  entryComponents: [
    CreateSubstationModalComponent,
    CreateConnectionModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgbModule,
    NgSelectModule,
    FormsModule,
    HttpClientModule,
    CarouselModule,
    BrowserAnimationsModule,
    DashboardModule,
    SldEditorModule
  ],
  providers: [
    HelperService,
    DatePipe,
    {provide: LOCALE_ID, useValue: 'en'}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
