import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-add-edit-area',
  templateUrl: './add-edit-area.component.html',
  styleUrls: ['./add-edit-area.component.scss']
})
export class AddEditAreaComponent implements OnInit {
  form: FormGroup;
  @Input() data: any = {};
  @Input() placeholder: '';
  @Input() type: '';
  submitted = false;
  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.setGroupData(this.data);
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

  setGroupData(data) {
    this.data = data;
    this.form = this.formBuilder.group({
      areaId: [data.areaId, Validators.required],
      description: [data.description, Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }
    const data = {
      areaId: this.form.controls.areaId.value,
      description: this.form.controls.description.value
    };
    this.activeModal.close({type: 'save', data: data});
  }
}
