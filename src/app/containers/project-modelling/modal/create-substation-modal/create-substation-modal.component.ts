import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-substation-modal',
  templateUrl: './create-substation-modal.component.html',
  styleUrls: ['./create-substation-modal.component.scss']
})
export class CreateSubstationModalComponent implements OnInit {
  form: FormGroup;
  submitted: boolean;
  @Input() edit: boolean;
  @Input() masterData: any;
  @Input() marker: any;

  constructor(
    private formBuilder: FormBuilder, public activeModal: NgbActiveModal, private router: Router) {
  }

  ngOnInit() {
    const properties = this.marker ? this.marker.getProperties() : {};
    this.form = this.formBuilder.group({
      name: [properties.name, Validators.required],
      region: [properties.region, Validators.required],
      reference: [properties.reference, Validators.required],
      type: [properties.type, Validators.required],
      owner: [properties.owner, Validators.required],
      administer: [properties.administer, Validators.required],
      longitude: [properties.longitude, Validators.required],
      latitude: [properties.latitude, Validators.required],
      altitude: [properties.altitude, Validators.required],
      constructionArea: [properties.constructionArea],
      totalArea: [properties.totalArea],
      freeSpace: [properties.freeSpace],
      controlRooms: [properties.controlRooms],
      switchgear: [{value: properties.switchgear, disabled: true}],
      voltageLevel: [{value: properties.voltageLevel, disabled: true}],
      installationYear: [{value: properties.installationYear, disabled: true}],
      commisioningYear: [{value: properties.commisioningYear, disabled: true}],
      possibilityToExtend: [{value: properties.possibilityToExtend, disabled: true}],
    });
  }

  /**
   * get form controllers
   */
  get f(): any {
    return this.form.controls;
  }
  /**
   * Validate sub station
   * @param name - field name
   * @returns - valid or not
   */
  validation(name): any {
    return this.submitted && this.form.controls[name].errors && this.form.controls[name].errors.required;
  }

  /**
   * Submit form
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }
    this.activeModal.close({type: 'save', data: {
      id: this.marker.getId(),
      name: this.f.name.value,
      region: this.f.region.value,
      reference: this.f.reference.value,
      type: this.f.type.value,
      owner: this.f.owner.value,
      administer: this.f.administer.value,
      longitude: this.f.longitude.value,
      latitude: this.f.latitude.value,
      altitude: this.f.altitude.value,
      constructionArea: this.f.constructionArea.value,
      totalArea: this.f.totalArea.value,
      freeSpace: this.f.freeSpace.value,
      controlRooms: this.f.controlRooms.value,
      switchgear: this.f.switchgear.value,
      voltageLevel: this.f.voltageLevel.value,
      installationYear: this.f.installationYear.value,
      commisioningYear: this.f.commisioningYear.value,
      possibilityToExtend: this.f.possibilityToExtend.value,
    }});

    this.router.navigate(['/sld-editor']);
  }

  /**
   * Delete marker
   */
  deleteMarker() {
    this.activeModal.close({type: 'delete', data: this.marker.getId()});
  }

  close() {
    this.activeModal.close({type: 'close'});
  }
}
