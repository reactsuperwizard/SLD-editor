import { Component, Input, Output, EventEmitter } from '@angular/core';

/**
 * the name-dialog component
 */
@Component({
    selector: 'sld-name-dialog',
    styleUrls: ['../shared-styles/dialog.scss', './name-dialog.component.scss'],
    templateUrl: './name-dialog.component.html'
})
export class NameDialogComponent {

    @Input() name: string;
    @Input() type: string;

    @Input()
    set error(message: string) {
        this.showMessage(message, 3000);
    }

    @Output() save = new EventEmitter();
    @Output() discard = new EventEmitter();

    private pendingTimeout: any;
    public message: string;

    /**
     * on save
     * emit save event if name entered is not null
     * Important: the main editor component handles the validation of uniqueness etc
     * so no such validation is done here
     * main editor component sets an error message on this component, in case uniqueness check fails
     */
    public onSave() {
        if (!this.name) {
            return this.error = 'Please enter a value';
        }
        this.save.emit(this.name);
    }

    /**
     * on discard
     */
    public onDiscard() {
        this.discard.emit();
    }

    /**
     * show alert message
     * @param message: message to show
     * @param duration: display duration
     */
    private showMessage(message: string, duration: number) {
        clearTimeout(this.pendingTimeout);
        this.message = message;
        this.pendingTimeout = setTimeout(() => {
            this.message = null;
        }, duration);
    }

}
