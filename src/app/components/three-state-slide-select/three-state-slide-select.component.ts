import { Component, OnInit, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-three-state-slide-select',
  templateUrl: './three-state-slide-select.component.html',
  styleUrls: ['./three-state-slide-select.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ThreeStateSlideSelectComponent),
    multi: true
  }]
})
export class ThreeStateSlideSelectComponent implements OnInit {

  @Input() states = ['Hide', 'View', 'Edit'];
  @Input() disabled = false;
  @Input() readOnly = false;
  value = '';
  currentIndex = 0;

  /**
  * Invoked when the model has been changed
  */
  onChange: (_: any) => void = (_: any) => { };

  /**
   * Invoked when the model has been touched
   */
  onTouched: () => void = () => { };

  constructor() { }

  ngOnInit() {
    if (this.value) {
      this.currentIndex = this.states.indexOf(this.value);
    }
  }

  /**
   * Registers a callback function that should be called when the control's value changes in the UI.
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers a callback function that should be called when the control receives a blur event.
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
  * Writes a new value to the element.
  */
  writeValue(newValue: string): void {
    if (newValue !== this.value) {
      this.value = newValue;
      this.updateChanges();
    }
  }

  /**
   * Method that is invoked on an update of a model.
   */
  updateChanges() {
    this.currentIndex = this.states.indexOf(this.value);
    this.onChange(this.value);
  }

}
