import { Component, OnInit, Input, Output, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import * as go from 'gojs';

import { SldUtilService } from '../services/util.service';
import { config } from '../config';

/**
 * the menu-bar component
 */
@Component({
    selector: 'sld-menu-bar',
    styleUrls: ['./menu-bar.component.scss'],
    templateUrl: './menu-bar.component.html'
})
export class MenuBarComponent implements OnInit {

    @ViewChild('menuBarDiv')
    private menuBarRef: ElementRef;

    @ViewChild('inputSubstationJSONFile')
    private inputSubstationJSONFileRef: ElementRef;
    public substationFileInputValue: any;
    @ViewChild('inputComponentDataFile')
    private inputComponentDataFileRef: ElementRef;
    public componentDataFileInputValue: any;


    @Input() diagram: go.Diagram;
    @Input() labelsShown: boolean;
    @Input() diagramName: string;
    @Input() currentShade: string;
    @Input() viewModeActive: boolean;

    // event emitters for various button clicks
    @Output() find = new EventEmitter();
    @Output() new = new EventEmitter();
    @Output() labelsToggle = new EventEmitter();
    @Output() fullscreenToggle = new EventEmitter();
    // event emitter to signal an explicity update of substation JSON is required
    @Output() substationUpdate = new EventEmitter<boolean>();
    @Output() import = new EventEmitter<any>();
    @Output() toast = new EventEmitter<string>();
    @Output() escape = new EventEmitter();
    @Output() shade = new EventEmitter<string>();
    @Output() dataUpdate = new EventEmitter();
    @Output() viewModeToggle = new EventEmitter();


    public menuBar: any;
    public selectedMenuItem: any;

    public iconsPath = config.ASSETS_DIR + 'icons/';

    constructor(private utilService: SldUtilService) {

        // define all the sections and buttons of menu-bar
        this.menuBar = [
            {
                name: 'Configuration',
                icon: 'file',
                subItems: [
                    {
                        name: 'New diagram',
                        can: () => this.diagram.nodes.count,
                        fn: () => this.new.emit()
                    },
                    {
                        name: 'Import configuration',
                        enabled: true,
                        fn: () => {
                            this.inputSubstationJSONFileRef.nativeElement.click();
                        },
                        icon: 'load'
                    },
                    {
                        name: 'Import component data',
                        fn: () => {
                            this.inputComponentDataFileRef.nativeElement.click();
                        },
                        icon: 'import'
                    },
                    {
                        name: 'Export configuration',
                        can: () => this.diagram.nodes.count,
                        fn: () => this.utilService.exportSubstationJSON(),
                        icon: 'save'
                    },
                    {
                        name: 'Export component data',
                        can: () => this.diagram.nodes.count,
                        fn: () => {
                            const result = this.utilService.exportComponentData();
                            if (!result) {
                                this.toast.emit('No components to export');
                            }
                        },
                        icon: 'export'
                    },
                    {
                        name: 'Export diagram as image',
                        can: () => this.diagram.nodes.count,
                        fn: () => this.exportImage(),
                        icon: 'export'
                    },
                    {
                        name: 'Print diagram',
                        can: () => this.diagram.nodes.count,
                        fn: () => this.print(),
                        icon: 'print'
                    }
                ]
            },
            {
                name: 'View',
                icon: 'view',
                subItems: [
                    {
                        name: 'Toggle labels',
                        enabled: true,
                        fn: () => this.labelsToggle.emit(),
                        isActivated: () => this.labelsShown,
                        icon: 'checkbox'
                    },
                    {
                        name: 'Protection relay trip lines',
                        enabled: true,
                    },
                    {
                        name: 'Show in full screen',
                        enabled: true,
                        fn: () => this.fullscreenToggle.emit(),
                        isActivated: () => {
                            const d = (document as any);
                            return d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement || d.mozFullScreenElement;
                        },
                        icon: 'checkbox'
                    },
                ]
            },
            {
                name: 'Shade',
                icon: 'shade',
                subItems: [
                    {
                        name: 'Shade by zone',
                        enabled: true,
                        fn: () => this.shade.emit('zone'),
                        isActivated: () => this.currentShade === 'zone',
                        icon: 'radio-active'
                    },
                    {
                        name: 'Shade by impact area',
                        enabled: true,
                        fn: () => this.shade.emit('impact'),
                        isActivated: () => this.currentShade === 'impact',
                        icon: 'radio-active'
                    },
                    {
                        name: 'Shade by risk',
                        enabled: true,
                        fn: () => this.shade.emit('risk'),
                        isActivated: () => this.currentShade === 'risk',
                        icon: 'radio-active'
                    },
                    {
                        name: 'Shade by results',
                        enabled: true,
                        fn: () => this.shade.emit('results'),
                        isActivated: () => this.currentShade === 'results',
                        icon: 'radio-active'
                    },
                    {
                        name: 'No shade',
                        enabled: true,
                        fn: () => this.shade.emit(null),
                        isActivated: () => !this.currentShade,
                        icon: 'radio-active'
                    },
                ]
            },
            {
                name: 'Analysis',
                icon: 'analysis',
                subItems: [
                    {
                        name: 'Assign reliability data',
                        // this item should be shown even if the button action is disabled
                        // TODO: Inconsistency in design
                        enabled: true,
                        fn: () => {
                            // ideally this check should be in the `can()` function and not here
                            // but to keep this item visible even if action is disabled, the logic is moved here
                            if (!this.diagram.selection.count || !this.diagram.selection.any(node => !node.category)) {
                              return;
                            }
                            const selectedNodes = this.diagram.selection.filter(node => !node.category).toArray();
                            this.utilService
                                .assignReliabilityData(selectedNodes.map(node => node.data))
                                .subscribe(() => {
                                    this.substationUpdate.emit(true);
                                    this.toast.emit('Reliability data successfully upated');
                                    this.dataUpdate.emit();
                                });
                        }
                    },
                    { name: 'Assess reliability', enabled: true },
                    { name: 'Export results', enabled: true },
                ]
            }
        ];
    }

    /**
     * the menu-bar component init
     */
    ngOnInit() {
        // disable native right-click context-menu on component
        this.menuBarRef.nativeElement.addEventListener('contextmenu', e => {
            e.preventDefault();
            return false;
        }, false);

        // if user clicks outside menu bar, deselect any seleted menu-item
        const clickEventListener = e => {
            if (!this.menuBarRef.nativeElement.contains(e.target)) {
                this.selectedMenuItem = null;
            }
        };
        window.addEventListener('click', clickEventListener);
        window.addEventListener('contextmenu', clickEventListener);
        window.addEventListener('touchstart', clickEventListener);

        // handle the keyboard shortcuts for actions
        // also override the default commands for some of the shortcuts
        // listen for desired shortcuts and perform actions
        // else pass on to super()
        this.diagram.commandHandler.doKeyDown = () => {
            const e = this.diagram.lastInput;
            const cmd = this.diagram.commandHandler;
            // rotate (Shift + R)
            if (e.shift && e.key === 'R' && this.diagram.selection.count === 1 && this.diagram.selection.first() instanceof go.Node) {
                return this.rotateSelection(90);
            }
            // select all (Ctrl + A)
            if ((e.control || e.meta) && e.key === 'A' && cmd.canSelectAll()) {
                return this.customSelectAll();
            }
            // cut (Ctrl + X)
            if (e.control && e.key === 'X' && cmd.canCutSelection()) {
                return cmd.cutSelection();
            }
            // copy (Ctrl + C)
            if (e.control && e.key === 'C' && cmd.canCopySelection()) {
                return cmd.copySelection();
            }
            // paste (Ctrl/Cmd + V)
            if ((e.control || e.meta) && e.key === 'V' && cmd.canPasteSelection()) {
                if (this.viewModeActive) { return; }
                return cmd.pasteSelection(this.diagram.lastInput.documentPoint.add(new go.Point(40, -30)));
            }
            // undo (Ctrl + Z)
            if ((e.control || e.meta) && e.key === 'Z' && cmd.canUndo()) {
                if (this.viewModeActive) { return; }
                cmd.undo();
                return this.utilService.specialUserActionSubject.next();
            }
            // redo (Ctrl + Y)
            if ((e.control || e.meta) && e.key === 'Y' && cmd.canRedo()) {
                if (this.viewModeActive) { return; }
                cmd.redo();
                return this.utilService.specialUserActionSubject.next();
            }
            // reset zoom (Ctrl + 0)
            if (e.control && e.key === '0' && cmd.canResetZoom()) {
                return cmd.resetZoom();
            }
            // // toggle (Shift + T)
            // if (e.shift && e.key === 'T' && this.canToggleSelection()) {
            //     return this.toggleSelection();
            // }
            // find (Ctrl/Cmd + F)
            if ((e.control || e.meta) && e.key === 'F') {
                return this.find.emit();
            }
            // toggle grid (Ctrl/Cmd + G)
            if ((e.control || e.meta) && e.key === 'G') {
                return this.diagram.grid.visible = !this.diagram.grid.visible;
            }
            // print (Ctrl/Cmd + P)
            if ((e.control || e.meta) && e.key === 'P') {
                return this.print();
            }
            // toggle labels (Shift + L)
            if (e.shift && e.key === 'L') {
                return this.labelsToggle.emit();
            }
            // escape
            if (e.key === 'Esc') {
                return this.escape.emit();
            }
            go.CommandHandler.prototype.doKeyDown.call(this.diagram.commandHandler);
        };
    }

    /**
     * seletct menu item
     * called when user clicks on one of the buttons representing a section of the menu-bar
     * @param item: the menu-item selected
     */
    public toggleMenuItem(item: any) {
        // if already selected, then de-select
        if (this.selectedMenuItem === item) {
            return this.selectedMenuItem = null;
        }
        // iterate through all sub-menus and mark them as enabled or activated etc.
        item.subItems.forEach(subItem => {
            if (subItem.can) {
                subItem.enabled = subItem.can(this.diagram.commandHandler);
            }
            if (subItem.isActivated) {
                subItem.activated = subItem.isActivated();
            }
        });
        this.selectedMenuItem = item;
    }

    /**
     * seletct menu sub-item
     * usually, an action is performed on sub-menu-button click
     * @param subItem clicked
     */
    public onClickMenuSubItem(subItem: any) {
        if (subItem.fn) {
            subItem.fn(this.diagram.commandHandler);
        }
        this.selectedMenuItem = null;
    }

    /**
     * print
     * takes an image of the diagram, and invokes a print
     */
    private print() {
        this.viewModeToggle.emit();

        setTimeout(() => {
            const bounds = this.diagram.documentBounds.copy();
            const svg = this.diagram.makeSvg({ size: new go.Size(bounds.width, bounds.height) });
            const printWindow = window.open('', '', 'height=500,width=600');
            printWindow.document.body.appendChild(svg);
            printWindow.print();
            this.viewModeToggle.emit();
        });
    }

    /**
     * export image
     * takes an image of the diagram, and invokes a download
     */
    private exportImage() {
        const bounds = this.diagram.documentBounds.copy();
        const imageDataOptions = {
            size: new go.Size(bounds.width, bounds.height),
            returnType: 'blob',
            background: 'white',
            callback: blob => {
                this.utilService.downloadBlobAsImage(blob, this.diagramName);
            }
        };
        this.diagram.makeImageData((imageDataOptions as any));
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
     * on substation JSON file selected
     * user has selected a JSON file for import
     * import the file and send the data to main SLD editor component
     */
    public onSubstationJSONFileSelected(event) {
        const file = event.target.files[0];
        if (!file) { return; }
        this.substationFileInputValue = null;
        this.import.emit(file);
    }

    /**
     * on component data file selected
     * user has selected an excel file for component data
     * send the file to service for component data import
     */
    public onComponentDataFileSelected(event) {
        const file = event.target.files[0];
        if (!file) { return; }
        this.componentDataFileInputValue = null;
        this.utilService.importComponentData(file).subscribe(() => {
            this.toast.emit('Component data successfully imported');
        }, () => {
            this.toast.emit('Error importing component data');
        });
    }

}
