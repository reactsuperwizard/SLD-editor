import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-role-card',
  templateUrl: './role-card.component.html',
  styleUrls: ['./role-card.component.scss']
})
export class RoleCardComponent {

  @Input() role: any;
  @Output() roleClick = new EventEmitter();

}
