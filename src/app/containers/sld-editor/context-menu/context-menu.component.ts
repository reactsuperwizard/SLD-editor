import { Component, OnInit, Input, Output, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import * as go from 'gojs';

import { config } from '../config';

/**
 * the context-menu component
 */
@Component({
    selector: 'sld-context-menu',
    styleUrls: ['./context-menu.component.scss'],
    templateUrl: './context-menu.component.html'
})
export class ContextMenuComponent implements OnInit {

    @ViewChild('contextMenuDiv')
    private contextMenuRef: ElementRef;

    private contextMenu: go.HTMLInfo;
    // the contextMenuObj is defined in the main sld-component
    // it's properties are set here
    @Input()
    set contextMenuObj(contextMenuObj: go.HTMLInfo) {
        this.contextMenu = contextMenuObj;

        if (this.contextMenu) {
            this.contextMenu.show = () => {
                setTimeout(() => {
                    // Show only the relevant items given the current state.
                    this.items.forEach(item => {
                        item.visible = item.can(this.diagram.commandHandler);
                        if (item.textFn && item.visible) {
                            item.text = item.textFn();
                        }
                        if (item.expandFn && item.visible) {
                            item.expansion = item.expandFn();
                        }
                    });
                    // Now show the whole context menu element
                    this.contextMenuRef.nativeElement.style.display = 'block';

                    this.show.emit();
                });
            };
        }
    }

    @Input() diagram: go.Diagram;
    @Input() currentSimulation: string;
    @Input() viewModeActive: boolean;

    // event emitter for when context menu is shown
    @Output() show = new EventEmitter();
    // event emitters for various item clicks
    @Output() metadataClick = new EventEmitter();
    @Output() stateSwitch = new EventEmitter();
    @Output() simulate = new EventEmitter();
    @Output() staticContent = new EventEmitter<any>();
    // event emitter to signal an explicity update of substation JSON is required
    @Output() substationUpdate = new EventEmitter<boolean>();
    @Output() viewConnected = new EventEmitter();
    @Output() refreshDisplay = new EventEmitter();

    public items: any = [];
    public iconsPath = config.ASSETS_DIR + 'icons/';

    constructor() {

        // list of possible items to show in context menu
        // each item item here has two functions that define it's visibility and action
        this.items = [
            {
                text: 'Copy',
                can: (cmd: go.CommandHandler) => cmd.canCopySelection() && !this.viewModeActive,
                fn: (cmd: go.CommandHandler) => cmd.copySelection(),
                icon: 'copy'
            },
            {
                text: 'Cut',
                can: (cmd: go.CommandHandler) => cmd.canCutSelection() && !this.viewModeActive,
                fn: (cmd: go.CommandHandler) => cmd.cutSelection(),
                icon: 'cut'
            },
            {
                text: 'Paste',
                can: (cmd: go.CommandHandler) => cmd.canPasteSelection() && !this.viewModeActive,
                fn: (cmd: go.CommandHandler) => cmd.pasteSelection(this.diagram.firstInput.documentPoint.add(new go.Point(40, -30))),
                icon: 'paste'
            },
            {
                text: 'Delete',
                can: (cmd: go.CommandHandler) => cmd.canDeleteSelection() && !this.viewModeActive,
                fn: (cmd: go.CommandHandler) => cmd.deleteSelection(),
                icon: 'trash',
                separator: true
            },
            {
                text: 'Rotate',
                can: () => this.diagram.selection.count === 1 && this.diagram.selection.first() instanceof go.Node && !this.viewModeActive,
                fn: () => this.rotateSelection(90),
                icon: 'rotate',
            },
            {
                text: 'Select all',
                can: (cmd: go.CommandHandler) => cmd.canSelectAll(),
                fn: () => this.customSelectAll(),
                icon: 'select-all',
                separator: true
            },
            {
                text: 'Component data',
                // only seen on certain objects that have metadata in their model
                can: () => this.diagram.selection.count === 1 && this.diagram.selection.first().data.metadataDescription,
                // emits onMetadata event, for SldEditorComponent to handle
                fn: () => this.metadataClick.emit(),
                icon: 'info',
                separator: true
            },
            {
                text: 'Switch',
                // only seen on certain objects that have states defined in their model
                can: () => this.diagram.selection.count === 1 && this.diagram.selection.first().data.states && !this.viewModeActive,
                expandFn: () => Object.keys(this.diagram.selection.first().data.states).map(state => (
                    {
                        text: state,
                        fn: () => {
                            const node = this.diagram.selection.first();
                            node.data.currentState = state;
                            node.data.sldData.isOpen = node.data.states[state] === 'open' ? true : false;
                            this.stateSwitch.emit();
                            this.substationUpdate.emit(true);
                        },
                        activated: this.diagram.selection.first().data.currentState === state
                    }
                )),
                icon: 'switch'
            },
            {
                text: 'Simulate',
                // only seen when there's one or more selection that is an equipment
                can: () => this.diagram.selection.count === 1 && this.diagram.selection.any(node => !node.category),
                expandFn: () => [
                    {
                        text: 'Simulate clear fault',
                        fn: () => this.simulate.emit('clear-fault'),
                        activated: this.currentSimulation === 'clear-fault'
                    },
                    {
                        text: 'Simulate isolate fault',
                        fn: () => this.simulate.emit('isolate-fault'),
                        activated: this.currentSimulation === 'isolate-fault'
                    },
                    {
                        text: 'Simulate isolate for maintenance',
                        fn: () => this.simulate.emit('isolate-maintenance'),
                        activated: this.currentSimulation === 'isolate-maintenance'
                    }
                ],
                icon: 'simulate'
            },
            {
                text: 'View connected',
                can: () => this.diagram.selection.count === 1 && this.diagram.selection.any(node => !node.category),
                fn: () => this.viewConnected.emit(),
                icon: 'connect',
                separator: true
            },
            {
                textFn: () => {
                    const excluded = this.diagram.selection.first().data.sldData.excludeFromImpact;
                    return excluded ? 'Display on impact' : 'Exclude from impact';
                },
                can: () => {
                    return this.diagram.selection.count === 1 &&
                            this.diagram.selection.any(node => node.data && node.data.class === 'load');
                },
                fn: () => {
                    const excluded = this.diagram.selection.first().data.sldData.excludeFromImpact;
                    this.diagram.selection.first().data.sldData.excludeFromImpact = !excluded;
                    this.refreshDisplay.emit();
                },
                icon: 'shade',
                separator: true
            },
            {
                text: 'Reliability figures',
                // only seen when one equipment is selected
                can: () => this.diagram.selection.count === 1 && this.diagram.selection.any(node => !node.category),
                // emits staticContent event, with some static data
                fn: () => this.staticContent.emit({
                    'title': 'Reliability figures',
                    'rows': ['condition', 'importance', 'risk', 'voltage']
                        .map(field => field + ': ' + this.diagram.selection.first().data.sldData[field])
                })
            },
        ];

    }

    /**
     * context menu item pressed
     * @param item the pressed item
     */
    public optionPressed(item: any) {
        if (item.fn) {
            item.fn(this.diagram.commandHandler);
            this.diagram.currentTool.stopTool();
        }
    }

    /**
     * rotate the currently selected objects
     * @param angle: the angle to rotate by
     */
    private rotateSelection(angle: number) {
        if (this.viewModeActive) { return; }

        this.diagram.startTransaction('rotate ' + angle.toString());
        this.diagram.selection.each(node => {
            const center = node.actualBounds.center;
            node.angle += angle;
            node.location = node.location.copy().subtract(center).rotate(angle).add(center);
        });
        this.diagram.commitTransaction('rotate ' + angle.toString());
        this.substationUpdate.emit();
    }

    /**
     * custom select all
     * the default GoJS select all would select all elements including hidden outage areas
     * this is not desired
     */
    private customSelectAll() {
        this.diagram.selectCollection(this.diagram.nodes.filter(node => node.visible));
    }

    /**
     * component init
     */
    ngOnInit() {
        this.contextMenu.mainElement = this.contextMenuRef.nativeElement;

        // remove 'right-click' behavior on the context menu itself (avoid inception :P)
        this.contextMenuRef.nativeElement.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        }, false);
    }

}
