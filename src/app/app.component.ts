import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  simpleItems = [
    { 'value': 1, 'label': 'Vilnius' },
    { 'value': 2, 'label': '22-Vilnius' },
    { 'value': 3, 'label': '33-Vilnius' }

  ];
  selectsimpleItems: any;
  showContent = true;


  constructor(public router: Router) { }
}
