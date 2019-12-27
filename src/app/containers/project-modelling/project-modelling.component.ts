import {Component, OnInit, ViewChild} from '@angular/core';
import {MapComponent} from './map/map.component';

@Component({
  selector: 'app-project-modelling',
  templateUrl: './project-modelling.component.html',
  styleUrls: ['./project-modelling.component.scss']
})
export class ProjectModellingComponent implements OnInit {
  @ViewChild(MapComponent) map: MapComponent;

  constructor() { }

  ngOnInit() {
  }

  /**
   * Sub Station Search
   * @param e - element
   */
  search(e) {
    const value = e.target.value;
    if (value && value !== '') {
      this.map.search(value);
    } else {
      this.map.focus();
    }
  }

  /**
   * Clear Search field
   * @param e - element
   */
  clear(e) {
    const value = e.target.value;
    if (!(value && value !== '')) {
      this.map.focus();
    }
  }
}
