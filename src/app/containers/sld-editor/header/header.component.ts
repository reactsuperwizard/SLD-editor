import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Location } from '@angular/common';
import * as go from 'gojs';

import { config } from '../config';

/**
 * the header component
 */
@Component({
    selector: 'sld-header',
    styleUrls: ['./header.component.scss'],
    templateUrl: './header.component.html'
})
export class HeaderComponent {

    @Input() viewModeActive: boolean;
    @Input() diagram: go.Diagram;

    @Output() viewModeToggle = new EventEmitter();

    public iconsPath = config.ASSETS_DIR + 'icons/';

    constructor(private location: Location) { }

    /**
     * toggle view mode
     * send an event to main sld editor component
     */
    public toggleViewMode() {
        this.viewModeToggle.emit();
    }

    /**
     * go back
     * go to previous route
     */
    public goBack() {
        this.location.back();
    }

}
