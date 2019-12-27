import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, EventEmitter } from '@angular/core';

/**
 * the dialog directive
 * largely handles the auto-closing of dialogs when user clicks outside dialog bounds
 */
@Directive({
    selector: '[sldDialog]'
})

export class DialogDirective implements AfterViewInit, OnDestroy {

    @Input('sldDialog')
    private close: EventEmitter<any>;

    constructor(private dialogRef: ElementRef) { }

    // click event listener for window
    // if user clicks outsie bounds of dialog, emit discard event
    public clickEventListener = e => {
        if (!this.dialogRef.nativeElement.contains(e.target)) {
            this.close.emit();
        }
    }

    /**
     * the component afterViewInit
     * sets up the click event listener for discard after a timeout
     */
    ngAfterViewInit() {
        setTimeout(() => {
            window.addEventListener('click', this.clickEventListener);
            window.addEventListener('contextmenu', this.clickEventListener);
            window.addEventListener('touchstart', this.clickEventListener);
        }, 100);
    }

    /**
     * the component onDestroy
     * clean up the hanging click event listenr
     */
    ngOnDestroy() {
        window.removeEventListener('click', this.clickEventListener);
        window.removeEventListener('contextmenu', this.clickEventListener);
        window.removeEventListener('touchstart', this.clickEventListener);
    }

}
