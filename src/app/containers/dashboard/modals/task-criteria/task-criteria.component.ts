import {Component, EventEmitter, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-task-criteria',
  templateUrl: './task-criteria.component.html',
  styleUrls: ['./task-criteria.component.scss']
})
export class TaskCriteriaComponent implements OnInit {
  @Input() data: any = {};
  @Input() title = '';
  name = '';
  weight = '';
  incremental = '';
  submitted = false;

  sliderOptions = {
    showSelectionBar: true,
    floor: 0,
    ceil: 100,
    step: 1,
  };
  manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  constructor(public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.name = this.data.name || '';
    this.weight = this.data.weight || 0;
    this.incremental = this.data.incremental || 0;
    setTimeout(() => {
      this.manualRefresh.emit();
    }, 1000);
  }
  onSubmit() {
    this.submitted = true;
    if (this.name === '') {
      return false;
    }
    const data = {
      name: this.name,
      weight: this.weight,
      incremental: this.incremental
    };
    this.activeModal.close({type: 'save', data: data});
  }
}
