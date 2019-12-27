import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-add-edit-outage-type',
  templateUrl: './add-edit-outage-type.component.html',
  styleUrls: ['./add-edit-outage-type.component.scss']
})
export class AddEditOutageTypeComponent implements OnInit {
  form: FormGroup;
  @Input() data: any = {};
  @Input() periocidy = [];
  submitted = false;
  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.setProjectData(this.data);
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

  setProjectData(data) {
    this.data = data;
    this.form = this.formBuilder.group({
      name: [data.type, Validators.required],
      duration: [data.duration, Validators.required],
      period: [data.period, Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }
    const data = {
      type: this.form.controls.name.value,
      duration: this.form.controls.duration.value,
      period: this.form.controls.period.value,
    };
    this.activeModal.close({type: 'save', data: data});
  }

}
