import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import * as go from 'gojs';

/**
 * the edit-area-dialog component
 */
@Component({
    selector: 'sld-edit-area-dialog',
    styleUrls: ['../shared-styles/dialog.scss', './edit-area-dialog.component.scss'],
    templateUrl: './edit-area-dialog.component.html'
})
export class EditAreaDialogComponent implements OnInit {

    public name: string;
    public duration: string;
    public schedule: string;
    public weight: string;

    public message: string;
    public dateFormatError: boolean;
    public weightFormatError: boolean;
    private pendingTimeout: any;

    public mode: string;

    @Input()
    set error(error: boolean) {
        if (error) {
            this.clearMessagesTimeout(3000);
            this.showUniqueNameMessage = true;
        }
    }

    @Input() diagram: go.Diagram;
    @Input() type: string;
    @Input() areaObject: any;
    @Output() close = new EventEmitter();
    @Output() save = new EventEmitter<any>();
    @Output() substationUpdate = new EventEmitter();

    public showRequiredFieldsMessage = false;
    public showInvalidDateMessage = false;
    public showUniqueNameMessage = false;

    /**
     * component on init
     */
    ngOnInit() {
        // if area object is supplied, the dialog is entered in edit more
        if (this.areaObject) {
            const nameKey = this.type === 'outage' ? 'outageAreaName' : 'bayName';

            this.name = this.areaObject[nameKey];
            this.duration = this.areaObject.duration;
            this.schedule = this.areaObject.scheduleString;
            this.weight = this.areaObject.weight;

            this.mode = 'edit';
        }
    }

    /**
     * discard the dialog
     */
    public discard() {
        this.close.emit();
    }

    /**
     * submit bay area
     * validate entered inputs, and emit the new area
     */
    private submitBayArea() {
        if (!this.name || !this.weight) {
            this.clearMessagesTimeout(1500);
            return this.showRequiredFieldsMessage = true;
        }

        if (isNaN(Number(this.weight))) {
            return this.weightFormatError = true;
        }

        // checks pass, create bay area
        this.save.emit({
            name: this.name,
            weight: this.weight,
        });
    }


    /**
     * submit outage area
     * validate entered inputs, and emit the new area
     */
    private submitOutageArea() {
        if (!this.name || !this.duration || !this.schedule) {
            this.clearMessagesTimeout(1500);
            return this.showRequiredFieldsMessage = true;
        }

        if (this.schedule.length !== 8) {
            return this.dateFormatError = true;
        }

        // try to construct a date with the user inputted string
        // ng-mask doesn't actually add the slashes ('/') to the input, so we need to add it here
        const date = new Date(this.schedule.substring(0, 2) + '/' + this.schedule.substring(2, 4) + '/' + this.schedule.substring(4));
        // invalid dates return NaN for .getTime()
        if (isNaN(date.getTime())) {
            this.clearMessagesTimeout(3000);
            return this.showInvalidDateMessage = true;
        }

        // checks pass, create outage area
        this.save.emit({
            name: this.name,
            duration: this.duration,
            schedule: date,
            scheduleString: this.schedule
        });
    }

    /**
     * submit
     */
    public submit() {
        return this.type === 'outage' ? this.submitOutageArea() : this.submitBayArea();
    }

    /**
     * clear messages timeout
     * clears all currently displayed messages immediately and,
     * clears all messages after a certain timeout
     * @param duration: timeout duration
     */
    private clearMessagesTimeout(duration: number) {
        clearTimeout(this.pendingTimeout);
        const clearMessages = () => {
            this.showRequiredFieldsMessage = false;
            this.showUniqueNameMessage = false;
            this.showInvalidDateMessage = false;
        };
        clearMessages();
        this.pendingTimeout = setTimeout(clearMessages, duration);
    }

}
