import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {ApplicationService} from '../../../../services/application.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AssignMemberComponent} from '../modals/assign-member/assign-member.component';
import {DeleteAlertModalComponent} from '../modals/delete-alert-modal/delete-alert-modal.component';

@Component({
  selector: 'app-add-edit-project',
  templateUrl: './add-edit-project.component.html',
  styleUrls: ['./add-edit-project.component.scss']
})
export class AddEditProjectComponent implements OnInit {
  form: FormGroup;
  id: any = null;
  loading: boolean;
  masterData: any = {};
  data: any = {
    systemManagers: [],
    projectManagers: [],
  };
  submitted = false;

  constructor(private dataService: ApplicationService,
              private formBuilder: FormBuilder,
              private router: Router,
              private modalService: NgbModal,
              private route: ActivatedRoute) {
  }

  ngOnInit() {

    this.setProjectData({
      systemManagers: [],
      projectManagers: [],
    });
    this.route.params.subscribe(params => {
      this.id = params['id'];
      if (this.id) {
        this.loading = true;
        this.dataService.getProject()
          .subscribe(this.setProjectData.bind(this), (error) => {
          });
      }
    });
    this.dataService.getMasterData()
      .subscribe(this.setMasterData.bind(this), (error) => {
      });
  }

  /**
   * Set project data
   * @param data - project data
   */
  setProjectData(data) {
    this.data = data;
    this.loading = false;
    this.form = this.formBuilder.group({
      projectName: [data.projectName, Validators.required],
      projectType: [data.projectType || '', Validators.required],
      projectCurrency: [data.projectCurrency || '', Validators.required],
      diagramSymbols: [data.diagramSymbols || '', Validators.required],
      decimalDelimiter: [data.decimalDelimiter || '', Validators.required],
      country: [data.country || '', Validators.required],
      state: [data.state || '', Validators.required],
      name: [data.name, Validators.required],
      area: [data.area || '', Validators.required],
      city: [data.city || '', Validators.required],
      startD: [data.startD || '', [Validators.required]],
      startM: [data.startM || '', [Validators.required]],
      startY: [data.startY || '', [Validators.required]],
      endD: [data.endD || '', [Validators.required]],
      endM: [data.endM || '', [Validators.required]],
      endY: [data.endY || '', [Validators.required]]
    });
  }

  /**
   * Set master data
   * @param data - master data
   */
  setMasterData(data) {
    this.masterData = data;
  }

  /**
   * Form submit
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.form.invalid) {
      console.log(this.form.controls);
      return;
    }
    this.router.navigate(['/dashboard']);
  }

  /**
   * Delete project
   */
  deleteProject() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.deleteItemName = 'project';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.router.navigate(['/dashboard']);
      }
    }, () => {
    });
  }

  /**
   * Validate project
   * @param name - field name
   * @returns - valid or not
   */
  validation(name): any {
    return this.submitted && this.form.controls[name] && this.form.controls[name].errors && this.form.controls[name].errors.required;
  }

  /**
   * get form controllers
   */
  get f(): any {
    return this.form.controls;
  }

  /**
   * Get countries
   * @returns - countries
   */
  getCountries() {
    const list = [];
    const countries = this.masterData.countries || [];
    countries.forEach(function (country) {
      list.push(country.name);
    });
    return list;
  }

  /**
   * Get states
   * @returns - states
   */
  getStates() {
    let list = [];
    const form = this.f;
    const countries = this.masterData.countries || [];
    countries.forEach(function (country) {
      if (country.name === form.country.value) {
        list = Object.keys(country.states);
      }
    });
    return list;
  }

  /**
   * Get Cities
   * @returns - Cities
   */
  getCities() {
    let list = [];
    const form = this.f;
    const countries = this.masterData.countries || [];
    countries.forEach(function (country) {
      if (country.name === form.country.value) {
        list = country.states[form.state.value];
      }
    });
    return list;
  }

  assignSystemManger() {
    this.modalService.open(AssignMemberComponent, {
      centered: true,
      size: 'lg',
      windowClass: 'large-screen-modal-window'
    }).result.then(res => {
      if (res instanceof Array && res.length > 0) {
        this.data.systemManagers = ([res[0]]);
      }
    }, () => {
    });
  }

  assignProjectManger() {
    this.modalService.open(AssignMemberComponent, {
      centered: true,
      size: 'lg',
      windowClass: 'large-screen-modal-window'
    }).result.then(res => {
      if (res instanceof Array) {
        this.data.projectManagers = [...this.data.projectManagers, ...res];
      }
    }, () => {
    });
  }

  removeSystemManager(index) {
    this.data.systemManagers.splice(index, 1);
  }

  removeProjectManager(index) {
    this.data.projectManagers.splice(index, 1);
  }

}
