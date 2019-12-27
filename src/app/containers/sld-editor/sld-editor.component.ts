import { Component, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as go from 'gojs';

import { SldUtilService } from './services/util.service';
import { DragCreatingTool } from './sld-drag-creating-tool';
import { config } from './config';

/**
 * the main SLD editor component
 */
@Component({
    selector: 'sld-editor',
    styleUrls: ['./sld-editor.component.scss'],
    templateUrl: './sld-editor.component.html'
})
export class SldEditorComponent {

    public diagram: go.Diagram;
    public palette: go.Palette;
    public hoverPalette: go.Palette;
    public contextMenu: go.HTMLInfo;

    public nameDialog: any = {};
    public metadataDialog: any = {};
    public contextMenuDisplay: any = {};
    public staticContentDialog: any = {};
    public toast: any = {};
    public editAreaDialog: any = {};
    public outageAreasList = [];
    public baysList = [];
    public userDrawMode = null;
    public selectedArea = null;
    // should the editor display 'ANSI' or 'IEC' symbols
    public standard = 'iec';
    public showLabels = false;
    public simulation: string;
    public shadeBy: string;
    // used to fetch images, so that browser always uses cache
    // this is to avoid flickering of widgets when switching widget images through states/simulation etc.
    public creationTimestamp = new Date().getTime();
    private sldReferenceIter: number;
    public iconsPath = config.ASSETS_DIR + 'icons/';
    public viewModeActive = false;
    public highlightConnectedComponents = false;
    private temporarilyOpenSwitches = [];

    public cmd: go.CommandHandler;

    @ViewChild('container')
    public containerRef: ElementRef;

    @ViewChild('loadedImagesDiv')
    private loadedImagesDivRef: ElementRef;

    public diagramName: string;

    constructor(private utilService: SldUtilService, private activatedRoute: ActivatedRoute) {
        const $ = go.GraphObject.make;

        // Initializaing an empty GoJS elements so we can use the reference
        // The actual building of the object views/templates takes place in their own components
        this.contextMenu = new go.HTMLInfo();
        this.diagram = new go.Diagram();
        this.palette = new go.Palette();
        this.hoverPalette = new go.Palette();

        this.cmd = this.diagram.commandHandler;

        // set the archetype data for any link created
        this.utilService.getLinkDataTemplate().subscribe(template => {
            this.diagram.toolManager.linkingTool.archetypeLinkData = {
                sldData: template
            };
        });

        // adding listeners on diagram for certain events
        // images need to be refrehsed (highlighted blue color)
        // if simulation was in progress, simulation is stopped
        const onEvent = () => {
            this.simulation = null;
            this.resetSwitchesAfterSimulation();
            this.highlightConnectedComponents = false;
            // some actions like 'undo' require a timeout to avoid race conditions
            setTimeout(() => {
                this.refreshNodesDisplay();
            });
        };
        this.diagram.addDiagramListener('ChangedSelection', onEvent);
        this.utilService.specialUserActionSubject.subscribe(onEvent);

        // any new node dragged or pasted in diagram, we use this as a hook to set the sldData
        const onNodeAdded = (event?: any) => {
            const addedNodes = [];
            // if node is provided as argument, use that,
            // or else just look at current diagram selection
            if (event && event.autoAddedNode) {
                addedNodes.push(event.autoAddedNode);
            } else {
                this.diagram.selection
                    .filter(node => !node.category)
                    .each(node => addedNodes.push(node));
            }

            addedNodes.forEach(node => {
                // assigning a copy of sld template
                node.data.sldData = SldUtilService.deepCopy(node.data.sldData);

                node.data.sldData.sldReference = 'SLD_Ref_' + this.sldReferenceIter;
                this.diagram.model.setDataProperty(node.data, 'sldReference', 'SLD_Ref_' + this.sldReferenceIter);
                this.sldReferenceIter += 1;
            });
        };
        this.diagram.addDiagramListener('ClipboardPasted', onNodeAdded);
        this.diagram.addDiagramListener('ExternalObjectsDropped', onNodeAdded);
        this.utilService.nodeAddedSubject.subscribe(onNodeAdded);
        // any new link drawn or created in diagram, we use this as a hook to set the sldData
        const onLinkAdded = (event) => {
            const link = event.subject;
            // assigning a copy of sld template
            link.data.sldData = SldUtilService.deepCopy(link.data.sldData);

            link.data.sldData.sldReference = 'SLD_Ref_' + this.sldReferenceIter;
            this.diagram.model.setDataProperty(link.data, 'sldReference', 'SLD_Ref_' + this.sldReferenceIter);
            this.sldReferenceIter += 1;
        };
        this.diagram.addDiagramListener('LinkDrawn', onLinkAdded);
        this.utilService.linkCreatedSubject.subscribe(onLinkAdded);

        // any link added / deleted
        // need to update data model of ports so that they can change appearance
        const onLinksChanged = () => {
            const linksData = (this.diagram.model as any).linkDataArray;

            // mark all ports as unconnected for convenience
            // cause if a link has been deleted, it's difficult to track which one specifically
            this.diagram.nodes
                .filter(node => node.data && !node.category)
                .each(node => {
                    node.itemArray
                        .filter(item => !item.type || item.type === 'pseudo-port')
                        .forEach(item => this.diagram.model.setDataProperty(item, 'connected', false));
                });
            // also need to update a (any) binding on the node
            // this needed cause of a goJS bug? (sometimes updating the port data doesn't actually invoke a refresh of bindings)
            this.diagram.nodes.each(node => {
                this.diagram.model.setDataProperty(node.data, 'fauxProperty', node.data && !node.data.fauxProperty);
            });

            // for each link, mark all REAL and PSEUDO ports as connected
            linksData.forEach(linkData => {
                let portsData = [];
                // "from" ports (REAL and PSEUDO)
                portsData = portsData.concat(
                    this.diagram
                        .findNodeForKey(linkData.from)
                        .itemArray.filter(item => item.id === linkData.fid || item.id === 'pseudo-' + linkData.fid)
                );
                // "to" ports (REAL and PSEUDO)
                portsData = portsData.concat(
                    this.diagram
                        .findNodeForKey(linkData.to)
                        .itemArray.filter(item => item.id === linkData.tid || item.id === 'pseudo-' + linkData.tid)
                );
                // mark all as connected
                portsData.forEach(portData => {
                    this.diagram.model.setDataProperty(portData, 'connected', true);
                });
                // also need to update a (any) binding on the node
                // this needed cause of a goJS bug? (sometimes updating the port data doesn't actually invoke a refresh of bindings)
                const nodes = [this.diagram.findNodeForKey(linkData.from), this.diagram.findNodeForKey(linkData.to)];
                nodes.forEach(node => {
                    this.diagram.model.setDataProperty(node.data, 'fauxProperty', node.data && !node.data.fauxProperty);
                });
            });
        };
        this.diagram.addDiagramListener('LinkDrawn', onLinksChanged);
        this.utilService.linkCreatedSubject.subscribe(onLinksChanged);
        this.utilService.specialUserActionSubject.subscribe(onLinksChanged);
        this.diagram.addDiagramListener('SelectionDeleted', onLinksChanged);
        this.utilService.diagramLoadedSubject.subscribe(onLinksChanged);

        // ensure consistency of outage area list on undo and redos
        // if do you delete an outage area, all it's nodes are deleted,
        // but undo would bring th nodes back, without updating the outageAreaList stored in editor
        const ensureUserDrawnAreaListConsistency = () => {
            this.diagram.nodes
                .filter(node => node.category === 'outage-area' || node.category === 'bay')
                .each(node => {
                    const areaList = node.category === 'outage-area' ? this.outageAreasList : this.baysList;
                    if (areaList.map(area => area.outageAreaName || area.bayName).indexOf(node.data.name) === -1) {
                        areaList.push(node.data.sldData);
                    }
                });
            this.updateSubstationJSON();
        };
        this.utilService.specialUserActionSubject.subscribe(ensureUserDrawnAreaListConsistency);

        // ensure consistency of diagram selection with part.data.isSelected property
        // when a part is deleted, it is removed from diagram selection
        // on undo, the part comes back with data.isSelected property as true, but diagram selection is not updated
        // this causes inconsistency in component display
        const ensureSelectionConsistency = () => {
            this.diagram.nodes.concat(this.diagram.links).each(part => {
                if (part.data && part.data.isSelected && !part.isSelected) {
                    part.isSelected = true;
                }
            });
        };
        this.utilService.specialUserActionSubject.subscribe(ensureSelectionConsistency);

        // all events that require an update of the Substation JSON via the service
        // note: these are only the GoJS diagram event listeners
        // there are more events that require an update of the Substation JSON
        this.diagram.addDiagramListener('ChangedSelection', () => this.updateSubstationJSON(true));
        this.diagram.addDiagramListener('ClipboardPasted', () => this.updateSubstationJSON());
        this.diagram.addDiagramListener('ExternalObjectsDropped', () => this.updateSubstationJSON());
        this.diagram.addDiagramListener('TextEdited', () => this.updateSubstationJSON(true));
        this.diagram.addDiagramListener('LinkDrawn', () => this.updateSubstationJSON());
        this.utilService.linkCreatedSubject.subscribe(() => this.updateSubstationJSON());
        this.diagram.addDiagramListener('PartResized', () => this.updateSubstationJSON());
        this.diagram.addDiagramListener('SelectionMoved', () => this.updateSubstationJSON());
        this.diagram.addDiagramListener('SelectionDeleted', () => this.updateSubstationJSON());
        this.utilService.specialUserActionSubject.subscribe(() => this.updateSubstationJSON());
        this.utilService.userAreaDrawnSubject.subscribe(() => this.updateSubstationJSON());


        // the palette model without the nodeDataArray
        this.palette.model = $(
            go.GraphLinksModel,
            {
                copiesArrays: true,
                copiesArrayObjects: true,
            }
        );
        this.hoverPalette.model = $(
            go.GraphLinksModel,
            {
                copiesArrays: true,
                copiesArrayObjects: true,
            }
        );

        // use custom function for assigning node keys
        this.palette.model.makeUniqueKeyFunction = (model, object) => this.makeUniqueKey(model, object);
        this.hoverPalette.model.makeUniqueKeyFunction = (model, object) => this.makeUniqueKey(model, object);

        // on the basis of standard the palette is loaded
        // IEC and ANSI are not compatible, so a new diagram model is required upon switching too
        this.activatedRoute.queryParams.subscribe(params => {
            this.standard = params['standard'] || this.standard;

            // fetch the widgets definition from JSON file and set the nodeDataArray in palette model
            this.utilService.getWidgetDefinitions().subscribe(nodesData => {
                nodesData = nodesData.filter(data => !data.exclusiveTo || data.exclusiveTo === this.standard);
                // separate the clusters into the hover palette
                const paletteNodesData = nodesData.filter(data => data.clusterHead || !data.cluster);
                let hoverPaletteNodesData = nodesData.filter(data => data.cluster && !data.clusterHead);
                hoverPaletteNodesData = hoverPaletteNodesData.concat(nodesData.filter(data => data.clusterHead));

                // push an extra text block widget
                // no image defined, so just the textBox would be seen in template
                paletteNodesData.push({
                    category: 'text-box',
                    name: 'text-box',
                    text: 'Text'
                });
                this.palette.model.nodeDataArray = SldUtilService.deepCopy(paletteNodesData);
                this.hoverPalette.model.nodeDataArray = SldUtilService.deepCopy(hoverPaletteNodesData);

                // explicity calling this method is necessary as the model in the JSON
                // doesn't actually have the 'image' property defined yet. It only defines an 'images' array.
                this.refreshNodesDisplay();
                // load all widget images (including closed/open state, simulation colored images etc.)
                // in the beginning so that whenever needed in future they are not fetched from server.
                this.loadAllWidgetImages();
            });

            this.createNewDiagramModel();

        });

        // define the custom tool to create user drawn areas by draggin mouse
        // it's disabled by default, and enabled by controller when in user draw mode
        this.diagram.toolManager.mouseMoveTools.insertAt(2, $(
            DragCreatingTool,
            { isEnabled: false, delay: 0, utilService: this.utilService }
        ));

    }

    /**
     * handle keyboard event
     * GoJS consumes keyboard events only when diagram is in focus
     * a lot of the shortcuts defined for editor conflict with browswer shortcuts
     * When control, shift, and command(on mac) keys are pressed, set focus on diagram
     * so that user keyboard shortcut commands may be capcutred
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (event.key === 'Control' || event.key === 'Meta' || event.key === 'Shift') {
            this.diagram.focus();
        }
        if (event.key === 'Escape') {
            this.escape();
        }
    }

    /**
     * on context menu show
     * sets the position of the context-menu
     */
    public onContextMenuShow() {
        const mousePt = this.diagram.lastInput.viewPoint;

        // don't let the context-menu overflow too much out of the container
        const containerHeight = this.containerRef.nativeElement.offsetHeight;
        const containerWidth = this.containerRef.nativeElement.offsetWidth;
        let desiredX = mousePt.x + 30;
        let desiredY = mousePt.y + 10;
        const expectedHeight = this.diagram.selection.count ? 400 : 50;
        const expectedWidth = this.diagram.selection.count ? 360 : 180;

        if (desiredY + expectedHeight > 0.95 * containerHeight) {
            desiredY = 0.95 * containerHeight - expectedHeight;
        }
        if (desiredX + expectedWidth > 0.95 * containerWidth) {
            desiredX = 0.95 * containerWidth - expectedWidth;
        }

        this.contextMenuDisplay = {
            left: desiredX + 'px',
            top: desiredY + 'px'
        };
    }

    /**
     * open name dialog
     * sets the position of the name-dialog, and assigns it name to edit
     */
    public openNameDialog() {
        const mousePt = this.diagram.lastInput.viewPoint;
        const desiredX = mousePt.x;

        // don't let the context-menu overflow too much out of the container
        const containerHeight = this.containerRef.nativeElement.offsetHeight;
        let desiredY = mousePt.y - 10;
        if (desiredY + 100 > 0.95 * containerHeight) {
            desiredY = 0.95 * containerHeight - 100;
        }

        this.nameDialog = {
            show: true,
            left: desiredX + 'px',
            top: desiredY + 'px',
            // we assume only one widget is selected (if any),
            // and that if multiple widgets are selcted, this method is never called
            nameToEdit: this.diagram.selection.count ? this.diagram.selection.first().key : this.diagramName,
            type: this.diagram.selection.count ? 'equipment' : 'diagram'
        };
    }

    /**
     * open metadata dialog
     * shows and sets the position of the metadata dialog compoennt
     */
    public openMetadataDialog() {
        const mousePt = this.diagram.lastInput.viewPoint;
        // we can assume only one widget is selected if metadata dialog is called to open
        const selectedWidget = this.diagram.selection.first();
        const metadataDescription = SldUtilService.deepCopy(selectedWidget.data.metadataDescription);
        const sldDataClone = SldUtilService.deepCopy(selectedWidget.data.sldData);

        // don't let the context-menu overflow too much out of the container
        const containerWidth = this.containerRef.nativeElement.offsetWidth;
        const containerHeight = this.containerRef.nativeElement.offsetHeight;

        let desiredX = mousePt.x + 30;
        let desiredY = mousePt.y - 50;

        if (desiredX + 450 > 0.9 * containerWidth) {
            desiredX = 0.9 * mousePt.x - 30 - 450;
        }
        if (desiredY + 350 > 0.95 * containerHeight) {
            desiredY = 0.95 * containerHeight - 350;
        }

        this.metadataDialog = {
            show: true,
            left: desiredX + 'px',
            top: desiredY + 'px',
            dataDescription: metadataDescription,
            sldData: sldDataClone
        };
    }

    /**
     * on static content dialog
     * show the static dialog and the content required
     * @param content: an object containing details like desired title and text of dialog
     */
    public openStaticContentDialog(content: any) {
        this.staticContentDialog = {
            show: true,
            title: content.title,
            rows: content.rows
        };
    }

    /**
     * on name dialog save
     * perofrm a uniqueness check for the new name, and set it
     * @param editedName: the new name assigned by user
     */
    public onNameDialogSave(editedName: string) {
        // check if user was editting a widget's name
        if (this.diagram.selection.count) {
            // if name is not changed, then do nothing
            const originalName = this.diagram.selection.first().key;
            if (editedName === originalName) {
                return this.nameDialog = {};
            }
            // check if the new name is a dupilicate of another node
            const duplicate = this.diagram.model.findNodeDataForKey(editedName);
            if (duplicate) {
                return this.nameDialog.error = 'Name entered is not unique';
            }
            // if checks have passed, update the widget's key with the new name,
            this.diagram.model.setKeyForNodeData(
                this.diagram.selection.first().part.data,
                editedName
            );
        } else {
            // if no adorned object, it means user was editting diagram name
            this.diagramName = editedName;
        }

        // closes the name dialog
        this.nameDialog = {};
        // update the Substation JSON
        this.updateSubstationJSON(true);
    }

    /**
     * close the name dialog
     */
    public onNameDialogDiscard() {
        this.nameDialog = {};
    }

    /**
     * on metadata dialog save
     * save the edited sldData as the new sldData of the object
     */
    public onMetadataDialogSave() {
        // we assume that exactly one widget is selected for metadata dialog to be open
        this.diagram.selection.first().data.sldData = this.metadataDialog.sldData;
        this.metadataDialog = {};
        // update the Substation JSON
        this.updateSubstationJSON(true);
    }

    /**
     * on metadata dialog discard
     * close the dialog without changing metadata of object
     */
    public onMetadataDialogDiscard() {
        this.metadataDialog = {};
    }

    /**
     * escape
     * triggered when user presses escape
     * close dialogs, and exit user daraw mode
     */
    public escape() {
        this.exitUserDrawMode();
        this.onMetadataDialogDiscard();
        this.onNameDialogDiscard();
        this.staticContentDialog = {};
        this.editAreaDialog = {};
    }

    /**
     * toggle user draw mode
     * enable / disable outage-area or bay creation modes
     */
    public toggleUserDrawMode(mode: string) {
        // disable the drawing tool on any toggling of mode
        const drawTool = this.diagram.toolManager.findTool('DragCreatingTool');
        drawTool.isEnabled = false;

        if (this.userDrawMode === mode) {
            return this.exitUserDrawMode();
        }
        this.diagram.selection.toArray().forEach(part => part.isSelected = false);
        this.simulation = null;
        this.highlightConnectedComponents = false;
        this.userDrawMode = mode;
        this.refreshNodesDisplay();
        this.updateSubstationJSON(true);
    }

    /**
     * exit user draw mode
     */
    public exitUserDrawMode() {
        this.userDrawMode = null;
        this.selectUserDrawnArea(null);
        this.refreshNodesDisplay();
        this.updateSubstationJSON(true);
    }

    /**
     * open edit area dialog
     */
    public openEditAreaDialog(area?: any) {
        setTimeout(() => {
            this.editAreaDialog = { show: true, type: this.userDrawMode, areaObject: area };
        });
    }

    /**
     * pick user drawn area color
     * pick the color for a new user drawn area (outageArea or bayArea)
     * @param: list of already used colors by other areas (so as to not repeat)
     */
    private pickUserDrawnAreaColor(usedColors: string[]) {
        // define function to change hex value of color to rgb
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            const rgb = {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            };
            return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 1)';
        };

        // the fixed palette for the first few colors
        const palette = [
            'rgba(108, 97, 255, 1)',
            'rgba(15, 128, 255, 1)',
            'rgba(240, 169, 48, 1)',
            'rgba(16, 196, 172, 1)',
            'rgba(227, 30, 113, 1)'
        ];

        // choose an avaiable color from palette or else pick a random color
        const availableColors = palette.filter(color => usedColors.indexOf(color) === -1);
        return availableColors[0] || hexToRgb(go.Brush.randomColor());
    }

    /**
     * on edit area dialog save
     * save new area object in the appropriate list and update substation JSON
     */
    public onEditAreaDialogSave(area: any) {
        const areaList = this.userDrawMode === 'outage' ? this.outageAreasList : this.baysList;
        const nameKey = this.userDrawMode === 'outage' ? 'outageAreaName' : 'bayName';

        const isAreaNameTaken = areaList.map(a => a[nameKey]).indexOf(area.name) !== -1;

        // if dialog was opened in edit mode, then the area details need to just be changed
        if (this.editAreaDialog.areaObject) {
            const oldName = this.editAreaDialog.areaObject[nameKey];
            // check if edited area name is a duplicate
            if (area.name !== oldName && isAreaNameTaken) {
                this.editAreaDialog.error = true;
                return setTimeout(() => { this.editAreaDialog.error = false; });
            }

            // modify the area object in list with the edits
            this.editAreaDialog.areaObject = Object.assign(this.editAreaDialog.areaObject, area);
            this.editAreaDialog.areaObject[nameKey] = area.name;
            delete this.editAreaDialog.areaObject.name;
            // modify the sldData for each node of the area
            this.diagram.nodes
                .filter(node => node.category === (this.userDrawMode === 'outage' ? 'outage-area' : 'bay'))
                .filter(node => node.data.name === oldName)
                .each(node => {
                    this.diagram.model.setDataProperty(node.data, 'sldData', SldUtilService.deepCopy(this.editAreaDialog.areaObject));
                    this.diagram.model.setDataProperty(node.data, 'name', this.editAreaDialog.areaObject[nameKey]);
                });

            // re-select this new area, so that the archetype node data is reset properly
            this.selectUserDrawnArea(this.editAreaDialog.areaObject);

            // close the dialog
            this.editAreaDialog = {};

            // update of substation with recalculations is required because name could have changed
            return this.updateSubstationJSON();
        }

        // Following code is for case when new area is being created

        // check if name entered is a duplicate
        if (isAreaNameTaken) {
            this.editAreaDialog.error = true;
            return setTimeout(() => { this.editAreaDialog.error = false; });
        }

        // close the dialog
        this.editAreaDialog = {};

        // get the template for the outage area / bay sld data set the archetype data on tool
        const templateObservable = this.userDrawMode === 'outage' ?
            this.utilService.getOutageAreaTemplate() : this.utilService.getBayTemplate();
        templateObservable.subscribe(template => {
            area[nameKey] = area.name;
            delete area.name;
            area = Object.assign({}, template, area);

            // add the new area to the appropriate list and select it
            areaList.push(area);

            // assign an available (or random) color to the area
            const usedColors = areaList.map(oa => oa.color);
            area.color = this.pickUserDrawnAreaColor(usedColors);
            area.backgroundColor = area.color.replace(', 1)', ', 0.1)');

            this.selectUserDrawnArea(area);

            this.updateSubstationJSON(true);

            this.showToast(this.userDrawMode === 'outage' ? 'Outage area created' : 'Bay created');
        });
    }

    /**
     * configure user drawn area tool
     * update the drag creating tool to use the new area properties
     */
    private configureUserDrawingTool(archeTypeNodeData) {
        const $ = go.GraphObject.make;
        const drawTool = this.diagram.toolManager.findTool('DragCreatingTool');

        drawTool.isEnabled = false;
        if (!archeTypeNodeData) {
            return;
        }

        // the template for the part drawn while dragging by the tool
        (drawTool as any).box = $(
            go.Part,
            { layerName: 'Tool' },
            $(
                go.Shape, 'RoundedRectangle',
                {
                    name: 'mainShape',
                    fill: archeTypeNodeData.backgroundColor,
                    stroke: archeTypeNodeData.color,
                    strokeWidth: 1
                }
            )
        );

        drawTool.isEnabled = true;
        (drawTool as any).archetypeNodeData = archeTypeNodeData;
    }

    /**
     * select user drawn area
     */
    public selectUserDrawnArea(area) {
        if (!area || this.viewModeActive) {
            this.configureUserDrawingTool(null);
            return this.selectedArea = null;
        }
        this.selectedArea = area;

        // configure the user drawn area tool to use the selected area properties
        const archetypeNodeData = {
            category: this.userDrawMode === 'outage' ? 'outage-area' : 'bay',
            name: area.outageAreaName || area.bayName,
            items: [],
            color: area.color,
            backgroundColor: area.backgroundColor,
            sldData: SldUtilService.deepCopy(area)
        };
        this.configureUserDrawingTool(archetypeNodeData);
    }

    /**
     * delete user drawn area
     * remove the area (outage or bay) from the appropriate list and update substation JSON
     */
    public deleteUserDrawnArea(area: any) {
        if (this.viewModeActive) { return; }

        if (this.selectedArea === area) {
            this.selectUserDrawnArea(null);
        }
        const areaList = this.userDrawMode === 'outage' ? this.outageAreasList : this.baysList;
        // remove from outage area list
        areaList.splice(areaList.indexOf(area), 1);

        const nodesToDelete = [];
        const areaName = area.outageAreaName || area.bayName;
        const nodeCategory = this.userDrawMode === 'outage' ? 'outage-area' : 'bay';
        this.diagram.nodes
            .filter(node => node.category === nodeCategory && node.data.name === areaName)
            .each(node => nodesToDelete.push(node));

        // delete all the nodes in a goJS transaction
        this.diagram.startTransaction('delete-areas');
        nodesToDelete.forEach(node => this.diagram.remove(node));
        this.diagram.commitTransaction('delete-areas');

        this.updateSubstationJSON();
    }

    /**
     * undo
     */
    public undo() {
        if (this.diagram.commandHandler.canUndo()) {
            this.diagram.commandHandler.undo();
            // emit the subject so that appropriate changes can be made
            this.utilService.specialUserActionSubject.next();
        }
    }

    /**
     * redo
     */
    public redo() {
        if (this.diagram.commandHandler.canRedo()) {
            this.diagram.commandHandler.redo();
            // emit the subject so that appropriate changes can be made
            this.utilService.specialUserActionSubject.next();
        }
    }

    /**
     * toggle view model
     * toggle between view and edit mode
     * for convenience, de-select any selected nodes / links
     */
    public toggleViewMode() {
        this.viewModeActive = !this.viewModeActive;

        if (this.viewModeActive) {
            this.selectUserDrawnArea(null);
        }

        this.refreshNodesDisplay();
    }

    /**
     * refresh nodes display
     * iterates all nodes and sets the 'image' property of each to appropriate value
     * changes the color of links if needed
     * hides / shows outage areas as needed
     * @param object whose keys are the nodes to highlight
     */
    public refreshNodesDisplay() {
        this.diagram.skipsUndoManager = true;
        let connectedComponents = {};
        let simulatedComponents = {};
        if (this.highlightConnectedComponents || this.simulation) {
            connectedComponents = this.getConnectedComponents();
            simulatedComponents = this.getConnectedComponents(true);
        }

        const colorMap = {
            'clear-fault': 'ff000f',
            'isolate-fault': 'ff000f',
            'isolate-maintenance': 'cb2bd5',
            'energized': '0ca919',
            'highlight': '0f6cff',
            'high-risk': 'ff000f',
            'medium-risk': 'f0b900',
            'low-risk': '0ca919',
            'high-voltage': 'ff000f',
            'medium-voltage': 'f0b900',
            'low-voltage': '0ca919',
            'impact': 'ff000f'
        };

        // defining the function to update a data element's image property to correct value
        const updateImageForDataInModel = (diagramType: string, data: any, node: go.Node) => {
            const model = this[diagramType].model;

            // the base image name is the name of the component itself
            let image = data.name;
            // if widget has multiple possible states, then append the current state to the image-name
            if (data.states) {
                image += '-' + data.states[data.currentState];
            }
            // if widget has different symbol for ansi mode, then append the current-mode
            if (data.hasAnsi) {
                image += '-' + this.standard;
            }
            // all images are png's
            image += '.svg';

            model.setDataProperty(data, 'color', 'black');

            // check if a colored image should be used for the selected widgets
            // this block only executed for diagram and not palette
            if (diagramType === 'diagram') {
                let color = null;
                const selectedKeys = this.diagram.selection.map(n => n.key);

                if (this.shadeBy === 'risk') {
                    const risk = node.data.sldData.risk;
                    const level = risk > 66 ? 'high' : (risk > 33 ? 'medium' : 'low');
                    color = colorMap[level + '-risk'];
                }

                if (this.shadeBy === 'zone') {
                    const voltage = node.data.sldData.voltage;
                    const level = voltage > 66 ? 'high' : (voltage > 33 ? 'medium' : 'low');
                    color = colorMap[level + '-voltage'];
                    model.setDataProperty(data, 'color', '#' + color);
                }

                if (this.shadeBy === 'impact' && node.data.class === 'load' && !node.data.sldData.excludeFromImpact) {
                    color = colorMap['impact'];
                }

                if (this.simulation) {
                    color = colorMap[simulatedComponents[node.key] ? this.simulation : 'energized'];
                    // set the ports color based on whether the node is connected to selection or not
                    model.setDataProperty(data, 'color', '#' + color);
                }

                if (this.highlightConnectedComponents && connectedComponents[node.key]) {
                    color = colorMap['highlight'];
                    model.setDataProperty(data, 'color', '#' + color);
                }
                image = color ? (color + '/' + image) : image;
            }

            model.setDataProperty(data, 'image', config.ASSETS_DIR + 'images/' + image + '?v=' + this.creationTimestamp);
        };

        // defining the function that will iterate through nodes and items of diagram
        const updateImagesForNodes = (nodes, diagramType: string) => {
            nodes
                // if node is not an equipment (default category), then there's no image associated
                .filter(node => node.data && !node.data.category)
                .each((node: any) => {
                    // if widget has ports with images, update those too
                    node.itemArray
                        .filter(item => !item.type && item.name)
                        .forEach(port => {
                            updateImageForDataInModel(diagramType, port, node);
                        });
                    // update the main image of the node
                    updateImageForDataInModel(diagramType, node.data, node);
                });
        };

        updateImagesForNodes(this.diagram.nodes, 'diagram');
        updateImagesForNodes(this.palette.nodes, 'palette');
        updateImagesForNodes(this.hoverPalette.nodes, 'hoverPalette');

        // set the view mode property for every node and link including textbox and outage areas
        this.diagram.nodes.concat(this.diagram.links)
            .filter(part => part.data)
            .each(part => {
                this.diagram.model.setDataProperty(part.data, 'viewModeActive', this.viewModeActive);
            });

        // update the link colors
        (this.diagram.model as any).linkDataArray.forEach(linkData => {
            let color = 'black';
            if (linkData.isSelected) {
                color = '#' + colorMap['highlight'];
            }
            if (this.shadeBy === 'zone') {
                color = this.diagram.findNodeForKey(linkData.from).data.color;
            }
            if (this.simulation) {
                if (simulatedComponents[linkData.to] && simulatedComponents[linkData.from]) {
                    color = this.diagram.findNodeForKey(linkData.to).data.color;
                }  else {
                    color = '#' + colorMap['energized'];
                }
            }
            if (this.highlightConnectedComponents &&
                  (connectedComponents[linkData.from] || connectedComponents[linkData.to])) {
                color = '#' + colorMap['highlight'];
            }
            this.diagram.model.setDataProperty(linkData, 'color', color);
        });

        // show or hide labels based on the editor setting
        this.diagram.nodes.each(node => {
            // text-box is the only node at the time of writing this that doesn't have itemArray defined
            if (node.itemArray) {
                const item = node.itemArray.filter(i => i.type === 'label')[0];
                this.diagram.model.setDataProperty(item, 'visible', this.showLabels);
            }
        });

        // set outage areas as visible or invisible
        this.diagram.nodes
            .filter(node => node.category === 'outage-area')
            .each(node => {
                node.visible = this.userDrawMode === 'outage';
                node.selectable = this.userDrawMode === 'outage';
            });
        // set the bays as visible or invisible
        this.diagram.nodes
            .filter(node => node.category === 'bay')
            .each(node => {
                node.visible = this.userDrawMode === 'bay';
                node.selectable = this.userDrawMode === 'bay';
            });
        // reduce opacity of all other nodes if user draw mode
        this.diagram.nodes
            .filter(node => node.category !== 'outage-area' && node.category !== 'bay')
            .each(node => {
                node.opacity = this.userDrawMode ? 0.5 : 1;
                node.selectable = !this.userDrawMode;
            });
        this.diagram.links
            .each(link => {
                link.opacity = this.userDrawMode ? 0.5 : 1;
                link.selectable = !this.userDrawMode;
            });
        this.diagram.skipsUndoManager = false;
    }

    /**
     * load all widgets images
     * goes through the entire list of widget, and loads every images for each widget
     * store these images in the DOM somewhere, so that the browser rememberes them
     */
    private loadAllWidgetImages() {
        this.palette.model.nodeDataArray.concat(this.hoverPalette.model.nodeDataArray).forEach((data: any) => {
            // if node is not an equipment (default category), then there's no image associated
            if (data.category) { return; }

            let images = [];
            // the base image name is the name of the component itself
            const baseImage = data.name;

            if (data.states) {
                // store all 'state' versions of the widget in the array
                images = Object.keys(data.states).map(state => baseImage + '-' + data.states[state]);
            } else {
                images = [baseImage];
            }

            // if component has different images for the IEC and ANSI, we load the appropriate one
            if (data.hasAnsi) {
                images = images.map(image => image + '-' + this.standard);
            }
            // load the port images if any
            images = images.concat(data.ports.filter(port => port.name).map(port => port.name));
            // add the png extension
            images = images.map(image => image + '.svg');

            // store all the colored images for the different simulation for each widget
            const coloredDirectories = ['ff000f', 'cb2bd5', 'f0b900', '0f6cff', '0ca919'];
            images = images.concat(
                images.map(image => coloredDirectories[0] + '/' + image),
                images.map(image => coloredDirectories[1] + '/' + image),
                images.map(image => coloredDirectories[2] + '/' + image),
                images.map(image => coloredDirectories[3] + '/' + image),
                images.map(image => coloredDirectories[4] + '/' + image)
            );

            // load all the collected images for the widget
            images.forEach(image => {
                const imageEl = new Image();
                // request images with fixed timestamp
                // all future requests for widget images will use the image downloaded here,
                // as they will fetch the image with the same timestamp
                imageEl.src = config.ASSETS_DIR + 'images/' + image + '?v=' + this.creationTimestamp;
                // store it in the DOM so that browser doesn't release the resource
                this.loadedImagesDivRef.nativeElement.appendChild(imageEl);
            });
        });
    }

    /**
     * update shade
     * update the shade by
     * @param type: the shade by type
     */
    public updateShade(type: string) {
        this.shadeBy = type;
        this.refreshNodesDisplay();
        this.updateSubstationJSON(true);
    }

    /**
     * on simulate
     * set the simulation type and refresh all widgets so that images are updated
     * @param type: the simulation type string
     */
    public onSimulate(type: string) {
        this.simulation = type;
        this.openSwitchesForSimulation();
        this.refreshNodesDisplay();
        this.updateSubstationJSON(true);
    }

    /**
     * toggle labels
     * show or hide widget labels
     */
    public toggleLabels() {
        this.showLabels = !this.showLabels;
        this.refreshNodesDisplay();
    }

    /**
     * create new diagram
     */
    public createNewDiagramModel(substationJSONFile?: any) {
        const $ = go.GraphObject.make;

        // try to import the JSON file first
        this.utilService.importSubstationJSONFile(this.standard, substationJSONFile)
            .subscribe(serializedSld => {
                // make sure to properly deselect any outage area / bay of the old model
                this.selectUserDrawnArea(null);
                this.userDrawMode = null;

                // if JSON is valid, then set the new diagram model
                this.diagram.model = $(
                    go.GraphLinksModel,
                    {
                        copiesArrays: true,
                        copiesArrayObjects: true,
                        linkFromPortIdProperty: 'fid',
                        linkToPortIdProperty: 'tid'
                    }
                );

                // use custom function for assigning keys to nodes
                this.diagram.model.makeUniqueKeyFunction = (model, object) => this.makeUniqueKey(model, object);

                this.diagram.model.nodeDataArray = serializedSld.nodes;
                (this.diagram.model as any).linkDataArray = serializedSld.links;
                this.diagramName = serializedSld.diagramName || 'My diagram';
                this.simulation = serializedSld.simulation;
                // resetting the sldReferenceIter
                this.sldReferenceIter = serializedSld.sldReferenceIter || 1;
                // select all previously selected widgets
                serializedSld.selectedKeys
                    .map(key => this.diagram.findNodeForKey(key))
                    .forEach(node => node ? node.isSelected = true : '');
                // outage area list needs to be grabbed from the substation JSON
                this.outageAreasList = serializedSld.outageAreasList || [];
                this.baysList = serializedSld.baysList;

                this.utilService.diagramLoadedSubject.next();
                this.refreshNodesDisplay();
                this.updateSubstationJSON();
            }, error => {
                // show a toast message describing the error
                this.showToast(error, 4000);
            });
    }

    /**
     * make unique key
     * custom key assigner for widgets
     * key is of the form: <widget-name> + <some-unique-id>
     */
    private makeUniqueKey(model: go.Model, object: any) {
        // we create a new key based on the name of the widget
        let identifier = 1;
        while (model.nodeDataArray.filter((n: any) => n.key === object.name + '-' + identifier).length) {
            // duplicate key exits in data
            identifier += 1;
        }
        return object.name + '-' + identifier;
    }

    /**
     * toggle fullscreen
     * checks if app is already in fullscreen mode
     * and calls the appropriate method
     */
    public toggleFullscreen() {
        const d = (document as any);
        if (d.fullscreenElement || d.webkitFullscreenElement || d.msFullscreenElement || d.mozFullScreenElement) {
            return this.exitFullscreen();
        }

        this.showFullscreen();
    }

    /**
     * show full screen
     * with vendor specific prefixes
     */
    private showFullscreen() {
        const elem = this.containerRef.nativeElement;
        const requestFullScreenFn = elem.requestFullscreen || elem.mozRequestFullScreen ||
            elem.webkitRequestFullscreen || elem.msRequestFullscreen;
        requestFullScreenFn.call(elem);
    }

    /**
     * exit fullscreen
     * with vendor specific prefixes
     */
    private exitFullscreen() {
        const d = (document as any);
        const exitFullScreenFn = d.exitFullscreen || d.mozCancelFullScreen || d.webkitExitFullscreen || d.msExitFullscreen;
        exitFullScreenFn.call(d);
    }

    /**
     * get connected components
     * get the recurse list of connected components of current selection
     */
    private getConnectedComponents(forSimulation?: boolean) {
        const connectedComponents = {};

        const selectedParts = this.diagram.selection.filter(part => !part.category && part.data);

        // define the recursive function to check connected parts
        const recursiveCheckForHiglight = part => {
            // open components are never connected, unless they we are finding connected for simulation
            if (!forSimulation && !selectedParts.contains(part)
                && part.data.states && part.data.states[part.data.currentState] === 'open') {
                return;
            }
            // if node is already marked, return as it's already been processed
            if (part instanceof go.Node && connectedComponents[part.key]) {
                return;
            }

            // beging the recursion
            if (part instanceof go.Node) {
                connectedComponents[part.key] = true;
            }
            // find immediately connected components
            const connectedParts = [];
            // find connected components to node except for open switches,
            // (unless the open part is part of selection and we are NOT looking for simulation)
            if (part instanceof go.Node &&
                (!(part.data.states && part.data.states[part.data.currentState] === 'open') ||
                 (!forSimulation && selectedParts.contains(part))
                )
            ) {
                this.diagram.links
                    .filter(link => link.data.from === part.key || link.data.to === part.key)
                    .each(link => connectedParts.push(link));
            }
            if (part instanceof go.Link) {
                connectedParts.push(this.diagram.findNodeForKey((part as go.Link).data.from));
                connectedParts.push(this.diagram.findNodeForKey((part as go.Link).data.to));
            }

            connectedParts.forEach(recursiveCheckForHiglight);
        };

        selectedParts.each(recursiveCheckForHiglight);

        return connectedComponents;
    }

    /**
     * open switches for simulate
     * recursively check for switches connected to selected component and open them
     */
    private openSwitchesForSimulation() {
        // find all connected components before
        const connectedComponents = this.getConnectedComponents(true);
        // for every switch in the connectedComponents that's closed, switch it to open
        const allConnectedSwitches = [];
        Object.keys(connectedComponents)
            .map(key => this.diagram.findNodeForKey(key))
            .forEach(node => {
                if (node.data.states) {
                    // save the previous state for reference later
                    allConnectedSwitches.push({
                        node: node,
                        previousState: node.data.currentState
                    });
                    // switch the current state to open
                    node.data.currentState = Object.keys(node.data.states)
                        .filter(state => node.data.states[state] === 'open')[0];
                    node.data.sldData.isOpen = true;
                }
            });

        // now calculate the connected components again
        // some of the switches previously logged might not be in the list,
        // if they were connected to selection via another switch in between
        // these are the switches, we actually don't want to change state for,
        // so we switch them back to previous state immediately
        const refrehsedConnectedComopnents = this.getConnectedComponents(true);
        allConnectedSwitches.forEach(s => {
            if (!refrehsedConnectedComopnents[s.node.key]) {
                // switch it back to previous state
                s.node.data.currentState = s.previousState;
                s.node.data.sldData.isOpen = s.node.data.states[s.previousState] === 'open' ? true : false;
            }
        });

        // store the switches which have been switched to open in a list in memory
        // so that they can be switched back later after simulation
        this.temporarilyOpenSwitches = allConnectedSwitches.filter(s => refrehsedConnectedComopnents[s.node.key]);
    }

    /**
     * reset switches after simulation
     * during simulation, some switches were temporarily opened.. reset them
     */
    private resetSwitchesAfterSimulation() {
        this.temporarilyOpenSwitches.forEach(s => {
            // switch it back to previous state
            s.node.data.currentState = s.previousState;
            s.node.data.sldData.isOpen = s.node.data.states[s.previousState] === 'open' ? true : false;
        });
        this.temporarilyOpenSwitches = [];
    }

    /**
     * show toast
     * automatically closes after timeout
     */
    public showToast(message, timeout?: number) {
        this.toast = {
            show: true,
            message: message
        };
        setTimeout(() => {
            this.toast = {};
        }, (timeout || 2000));
    }

    /**
     * update Substation JSON
     * make any necessary changes to nodesDataArray / linkDataArray and then
     * many any necessary calculations (like outage area component lists and connected component list etc)
     * send a requeset to service to update the in-memory JSON of the substation
     */
    public updateSubstationJSON(skipCalculations?: boolean) {
        // define an update function for convenience
        const update = () => this.utilService.updateSubstationJSON(
            this.diagramName,
            this.sldReferenceIter,
            this.simulation,
            this.diagram.selection
                .filter(part => part instanceof go.Node)
                .map(node => node.key)
                .toArray(),
            this.outageAreasList,
            this.baysList,
            this.standard
        );

        setTimeout(() => {
            if (skipCalculations) {
                return update();
            }

            // define function to get rect for node
            // the rect obatained is the rectangle defined by the main panel of the node
            // i.e. the image
            // thus, labels shown/hidden won't affect calculations
            const getNodeRect = (node) => new go.Rect(
                node.actualBounds.x,
                node.actualBounds.y,
                node.data.width,
                node.data.height
            );

            // recalculate userDrawn area components lists
            this.diagram.nodes
                .filter(node => !node.category && node.data)
                .each(node => {
                    node.data.bay = null;
                    node.data.outageArea = null;
                });
            this.diagram.nodes.filter(node => node.category === 'outage-area' || node.category === 'bay').each(area => {
                const areaRect = getNodeRect(area);
                this.diagram.nodes
                    .filter(node => !node.category && node.data)
                    .each(node => {
                        const nodeRect = getNodeRect(node);
                        if (areaRect.containsRect(nodeRect)) {
                            node.data[area.category === 'outage-area' ? 'outageArea' : 'bay'] = area.data.name;
                        }
                    });
            });

            // initialize all connectd component fields in sld data to default
            this.diagram.nodes
                .filter(node => !node.category && node.data)
                .each(node => {
                    node.data.sldData.connectedComponentsFirst = null;
                    node.data.sldData.connectedComponentsSecond = null;
                    if (node.data.isConnector) {
                        node.data.sldData.connectedComponentsList = [];
                    }
                });
            // update the connected component field ins sldData
            this.diagram.links
                .filter(link => link.data)
                // for each link get the 'to' and 'from' nodes, and update their data
                .each(link => {
                    const fromNode = this.diagram.model.findNodeDataForKey(link.data.from);
                    const toNode = this.diagram.model.findNodeDataForKey(link.data.to);

                    // function to update connection data in node
                    const logConnectionInSldData = (nodeData) => {
                        if (nodeData.isConnector) {
                            nodeData.sldData.connectedComponentsList.push(link.data.sldReference);
                        } else if (!nodeData.sldData.connectedComponentsFirst) {
                            nodeData.sldData.connectedComponentsFirst = link.data.sldReference;
                        } else {
                            nodeData.sldData.connectedComponentsSecond = link.data.sldReference;
                        }
                    };
                    logConnectionInSldData(fromNode);
                    logConnectionInSldData(toNode);

                    link.data.sldData.connectedComponentsFirst = fromNode.sldReference;
                    link.data.sldData.connectedComponentsSecond = toNode.sldReference;
                });

            update();

        });
    }

}
