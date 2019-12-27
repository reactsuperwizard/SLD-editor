import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ApplicationService } from 'src/services/application.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';

@Component({
  selector: 'app-edit-skill',
  templateUrl: './edit-skill.component.html',
  styleUrls: ['./edit-skill.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EditSkillComponent implements OnInit {

  manualRefresh: EventEmitter<void> = new EventEmitter<void>();
  skills = [];
  @Input() skillInput: any;
  skill: any;
  loading = true;
  sliderPerfOptions = {
    showSelectionBar: true,
    floor: 1,
    ceil: 5,
    step: 1,
    hidePointerLabels: true,
    hideLimitLabels: true
  };
  skillLevel: number;
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  today = new Date();
  years = [0, 1, 2, 3, 4, 5].map(n => this.today.getFullYear() + n);
  @ViewChild('fileInput') fileInputRef: ElementRef;

  constructor(private appSvc: ApplicationService, public activeModal: NgbActiveModal) { }

  ngOnInit() {
    this.skill = this.skillInput ? _.cloneDeep(this.skillInput) : {};
    this.appSvc.getSkills().subscribe(res => {
      this.loading = false;
      this.skills = res;
      this.skillLevel = 3;
      this.manualRefresh.emit();
      this.skill.name = this.skill.name || this.skills[0].skillName;
      this.skill.validityMonth = this.skill.validityMonth || this.months[this.today.getMonth()];
      this.skill.validityYear = this.today.getFullYear() + 1;
    });
  }

  save() {
    this.activeModal.close(this.skill);
  }

  attachDocument() {
    this.fileInputRef.nativeElement.click();
  }

  onInputFileSelected(event) {
    const file = event.target.files[0] as File;
    if (!file) { return; }
    this.skill.filename = file.name;
  }

  deleteSkill() {
    this.activeModal.close(null);
  }

}
