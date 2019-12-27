import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * the static-content-dialog component
 */
@Component({
    selector: 'sld-static-content-dialog',
    styleUrls: ['../shared-styles/dialog.scss', './static-content-dialog.component.scss'],
    templateUrl: './static-content-dialog.component.html'
})
export class StaticContentDialogComponent {

    // pretty much does nothing except handle input/output
    @Input() rows;
    @Input() title;
    @Output() close = new EventEmitter();

}
