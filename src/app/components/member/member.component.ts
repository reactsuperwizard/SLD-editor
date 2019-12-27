import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-member',
  templateUrl: './member.component.html',
  styleUrls: ['./member.component.scss']
})
export class MemberComponent implements OnInit {

  @Input() member: any = {};
  @Input() index = 0;
  @Output() remove = new EventEmitter();
  constructor() { }

  ngOnInit() {
  }

}
