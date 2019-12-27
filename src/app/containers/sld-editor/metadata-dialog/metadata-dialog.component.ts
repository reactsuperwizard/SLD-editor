import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

/**
 * the edit metadata component
 */
@Component({
    selector: 'sld-metadata-dialog',
    styleUrls: ['../shared-styles/dialog.scss', './metadata-dialog.component.scss'],
    templateUrl: './metadata-dialog.component.html'
})
export class MetadataDialogComponent implements OnInit {

    @Input() dataDescription: any;
    @Input() sldData: any;

    @Output() save = new EventEmitter();
    @Output() discard = new EventEmitter();

    public selectedTab: any;
    public message: string;
    private pendingTimeout: any;

    /**
     * the component init
     */
    ngOnInit() {
        this.selectedTab = this.dataDescription[0];

        // convert all fields to strings, so that it's easier to enforce format
        this.dataDescription.forEach(category => {
            category.properties.forEach(property => {
                if (property.type === 'number' && this.sldData[property.key] !== undefined && this.sldData[property.key] !== null) {
                    this.sldData[property.key] += '';
                    // add leading zeros to the value to follow format
                    let leadingZeros = property.format.length - this.sldData[property.key].length;
                    while (leadingZeros) {
                        this.sldData[property.key] = '0' + this.sldData[property.key];
                        leadingZeros -= 1;
                    }
                }
            });
        });
    }

    /**
     * on save
     * check if all required fields are filled before emitting 'save'
     */
    public onSave() {
        let allRequiredFieldsFilled = true;
        let allValidated = true;

        // validate fields
        this.dataDescription.forEach(category => {
            category.properties.forEach(property => {
                if (property.required && !this.sldData[property.key]) {
                    allRequiredFieldsFilled = false;
                }
                if (!this.validateFormat(property)) {
                    allValidated = false;
                }
            });
        });

        // if everything checks out, save the data
        if (allRequiredFieldsFilled && allValidated) {
            // convert all number properties to numbers again before saving
            this.dataDescription.forEach(category => {
                category.properties.forEach(property => {
                    if (property.type === 'number' && this.sldData[property.key]) {
                        this.sldData[property.key] = Number(this.sldData[property.key]);
                    }
                });
            });
            return this.save.emit();
        }

        if (!allRequiredFieldsFilled) {
            return this.showMessage('Some required fields missing', 3000);
        }

        this.showMessage('Some fields have format errors', 3000);
    }

    /**
     * on discard
     */
    public onDiscard() {
        this.discard.emit();
    }

    /**
     * validate a property
     * if it's a number field, check if it matches format
     * @param property to validate
     */
    public validateFormat(property: any): boolean {
        // only if value entered, we validate
        if (property.type === 'number' && property.format && this.sldData[property.key]) {
            // ngx-mask doesn't actually record the '.' in value if exists
            // so we put it in value here
            if (property.format.indexOf('.') !== -1 && this.sldData[property.key].indexOf('.') === -1) {
                const index = property.format.indexOf('.');
                this.sldData[property.key] = this.sldData[property.key].substring(0, index) +
                    '.' + this.sldData[property.key].substring(index);
            }
            if (this.sldData[property.key].length !== property.format.length) {
                // set error for display
                property.formatError = true;
                return false;
            }
        }
        delete property.formatError;
        return true;
    }

    /**
     * on user input
     * if a format error is marked on a field, check if new user input fixes it
     * @param property to validate
     */
    public onUserInput(property: any) {
        if (property.formatError) {
            this.validateFormat(property);
        }
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
