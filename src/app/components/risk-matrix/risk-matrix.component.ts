import { Component, OnInit, Input, forwardRef, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface RiskMatrixValue {
  lowRisk: number;
  highRisk: number;
}

const RISK_MIN = 10;
const RISK_MAX = 90;

@Component({
  selector: 'app-risk-matrix',
  templateUrl: './risk-matrix.component.html',
  styleUrls: ['./risk-matrix.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RiskMatrixComponent),
    multi: true
  }]
})
export class RiskMatrixComponent implements OnInit, ControlValueAccessor {

  // display mode of risk matrix
  @Input() mode: 'flexible' | 'absolute' | 'slide' = 'flexible';
  lowRiskAreaFlexible = '';
  highRiskAreaFlexible = '';
  @Input() riskMode = '';
  // holds the current value of the risk matrix
  value: RiskMatrixValue = {
    lowRisk: 30,
    highRisk: 70
  };
  lowRiskDragging = false;
  lowRiskHandleShow = false;
  highRiskDragging = false;
  highRiskHandleShow = false;

  @Input() flexibleRiskMatrixValue = [];

  @ViewChild('riskMatrix') riskMatrixElement: any;

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
  }

  /**
   * Method that is invoked on an update of a model.
   */
  updateChanges() {
    const low = this.value.lowRisk * 2;
    const high = (100 - this.value.highRisk) * 2;
    this.lowRiskAreaFlexible = [
      [0, 80 - low],
      [0, 100],
      [low + 20, 100],
      [low + 10, 90],
      [low - 10, 90],
      [10, 110 - low],
      [10, 90 - low]]
      .map(coord => coord.join(',')).join(' ');
    this.highRiskAreaFlexible = [
      [80 - high, 0],
      [100, 0],
      [100, high + 20],
      [90, high + 10],
      [90, high - 10],
      [110 - high, 10],
      [90 - high, 10]]
      .map(coord => coord.join(',')).join(' ');
    // this.lowRiskAreaFlexible
    this.onChange(this.value);
  }

  /**
    * Writes a new item to the element.
    * @param newValue the new value
    */
  writeValue(newValue: RiskMatrixValue): void {
    if (newValue) {
      this.value = newValue;
      this.updateChanges();
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


  handleDrag(event) {
    if (this.lowRiskDragging || this.highRiskDragging) {
      const matrixBounder = this.riskMatrixElement.nativeElement.getBoundingClientRect();
      let elementWidth = matrixBounder.width;
      const left =  matrixBounder.left;
      const top = matrixBounder.top;

      let lowRiskNew = this.value.lowRisk;
      let highRiskNew = this.value.highRisk;
      let x: number;
      let y: number;
      if (this.mode === 'slide') {
        x = (event.clientX - left) - elementWidth / 480 * 12;
        elementWidth = elementWidth * 468 / 480;
        if (this.lowRiskDragging) {
          lowRiskNew = x / elementWidth * 100;
          highRiskNew = Math.max(lowRiskNew, highRiskNew);
        } else {
          highRiskNew = x / elementWidth * 100;
          lowRiskNew = Math.min(lowRiskNew, highRiskNew);
        }
      } else {
        x = (event.clientX - left) - elementWidth / 126 * 15;
        y = (event.clientY - top) - elementWidth / 126 * 11;
        elementWidth = elementWidth * 100 / 126;
        if (this.lowRiskDragging) {
          lowRiskNew = (x + elementWidth - y) / elementWidth * 50;
          highRiskNew = Math.max(lowRiskNew, highRiskNew);
        } else {
          highRiskNew = (x + elementWidth - y) / elementWidth * 50;
          lowRiskNew = Math.min(lowRiskNew, highRiskNew);
        }
      }
      lowRiskNew = Math.round(lowRiskNew);
      highRiskNew = Math.round(highRiskNew);
      lowRiskNew = Math.max(lowRiskNew, RISK_MIN);
      lowRiskNew = Math.min(lowRiskNew, RISK_MAX);
      highRiskNew = Math.max(highRiskNew, RISK_MIN);
      highRiskNew = Math.min(highRiskNew, RISK_MAX);
      this.writeValue({ lowRisk: lowRiskNew, highRisk: highRiskNew });
    }
  }

  disableDrag() {
    this.lowRiskDragging = false;
    this.highRiskDragging = false;
    this.lowRiskHandleShow = false;
    this.highRiskHandleShow = false;
  }
}
