import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as go from 'gojs';

import { SldSnappingTool } from '../sld-snapping-tool.model';
import { SldUtilService } from '../services/util.service';

// constants that define the padding of the inner-grey-box and outer-grey box (for equipment)
const INNER_BOX_VERT_PADDING = 16;
const INNER_BOX_HOR_PADDING = 0;
const OUTER_BOX_VERT_PADDING = 32;
const OUTER_BOX_HOR_PADDING = 16;

const GRID_CELL_SIZE = 8;

// calling the GoJS Static function to
// define a custom shape: PillBox
go.Shape.defineFigureGenerator('PillBox', (shape, w, h) => {
    const r = Math.min(h / 2, w / 2);
    const geo = new go.Geometry();
    // a single figure consisting of straight lines and quarter-circle arcs
    geo.add(
        new go.PathFigure(0, r)
            .add(new go.PathSegment(go.PathSegment.Arc, 180, 90, r, r, r, r))
            .add(new go.PathSegment(go.PathSegment.Line, w - r, 0))
            .add(new go.PathSegment(go.PathSegment.Arc, 270, 90, w - r, r, r, r))
            .add(new go.PathSegment(go.PathSegment.Line, w, h - r))
            .add(new go.PathSegment(go.PathSegment.Arc, 0, 90, w - r, h - r, r, r))
            .add(new go.PathSegment(go.PathSegment.Line, r, h))
            .add(new go.PathSegment(go.PathSegment.Arc, 90, 90, r, h - r, r, r))
            .add(new go.PathSegment(go.PathSegment.Line, 0, r).close())
    );
    // don't intersect with two top corners when used in an "Auto" Panel
    geo.spot1 = new go.Spot(0, 0, 0.3 * r, 0.3 * r);
    geo.spot2 = new go.Spot(1, 1, -0.3 * r, 0);
    return geo;
});

/**
 * the main diagram component
 */
@Component({
    selector: 'sld-diagram',
    styleUrls: ['./diagram.component.scss'],
    templateUrl: './diagram.component.html'
})
export class DiagramComponent implements OnInit, AfterViewInit {

    @Input() diagram: go.Diagram;
    @Input() palette: go.Diagram;
    @Input() contextMenu: go.HTMLInfo;
    @Input() labelsShown: boolean;
    @Input() viewModeActive: boolean;

    @ViewChild('diagramDiv')
    private diagramRef: ElementRef;

    constructor(private utilService: SldUtilService) { }

    /**
     * the component init
     * mainly defines the diagram templates
     */
    ngOnInit() {
        const $ = go.GraphObject.make;

        // building the main diagram where the circuits are drawn
        this.diagram.setProperties({
            initialContentAlignment: go.Spot.Center,
            allowDrop: true,
            allowLink: true,
            'undoManager.isEnabled': true,
            contextMenu: this.contextMenu,
            draggingTool: new SldSnappingTool(this.utilService),
            'draggingTool.isGridSnapEnabled': true,
            autoScrollRegion: 32
        });

        // custom grid
        this.diagram.grid =  $(
            go.Panel, 'Grid',
            {
                name: 'GRID',
                visible: true,
                gridCellSize: new go.Size(GRID_CELL_SIZE, GRID_CELL_SIZE),
                gridOrigin: new go.Point(0, 0)
            },
            $(go.Shape, 'LineH', { stroke: '#3d3d3d', strokeWidth: 1, interval: 4, strokeDashArray: [0.5, 4 * GRID_CELL_SIZE - 0.5] }),
            $(go.Shape, 'LineV', { stroke: '#3d3d3d', strokeWidth: 1, interval: 4, strokeDashArray: [0.5, 4 * GRID_CELL_SIZE - 0.5] }),
        );

        // override the default resize tool to only allow horizontal axis resizing
        // also don't let user resize outage areas and bays without checking for overlaps first
        this.diagram.toolManager.resizingTool.resize = (newr) => {
            const obj = this.diagram.toolManager.resizingTool.adornedObject;
            if (obj.part.data.category) {
                if (obj.part.data.category === 'outage-area' || obj.part.data.category === 'bay') {
                    const otherUserDrawnAreas = this.diagram.nodes
                        .filter(node => node.category === obj.part.data.category)
                        .filter(node => node.key !== obj.part.key);

                    const newNodeBounds = new go.Rect(
                        obj.part.actualBounds.x + newr.x,
                        obj.part.actualBounds.y + newr.y,
                        newr.width + 3,
                        newr.height + 3
                    );
                    if (otherUserDrawnAreas.any(area => area.actualBounds.intersectsRect(newNodeBounds))) {
                        return;
                    }
                }
                return go.ResizingTool.prototype.resize.call(this.diagram.toolManager.resizingTool, newr);
            }

            newr.width = this.diagram.toolManager.resizingTool.adornedObject.actualBounds.width;
            // only allow resize increments / decreements in of GRID_CELL_SIZE

            // this next line is only added because the original height of the component is not a multiple of GRID_CELL_SIZE
            // but rather a multiple of GRID_CELL_SIZE / 2
            newr.height += GRID_CELL_SIZE;
            // restrict the bounds to multiple of GRID_CELL_SIZE
            if (newr.height % (2 * GRID_CELL_SIZE) !== 0) {
                newr.height += ((newr.height % (2 * GRID_CELL_SIZE) < GRID_CELL_SIZE) ?
                    0 : (2 * GRID_CELL_SIZE)) - newr.height % (2 * GRID_CELL_SIZE);
            }
            // this next line is only added because the original height of the component is not a multiple of GRID_CELL_SIZE
            // but rather a multiple of GRID_CELL_SIZE / 2
            newr.height -= GRID_CELL_SIZE;
            go.ResizingTool.prototype.resize.call(this.diagram.toolManager.resizingTool, newr);
        };

        // define the templates for the ports, label, and origin
        const itemTemplates = new go.Map('string', go.Panel);
        // template for the REAL ports
        itemTemplates.add('', $(
            go.Panel, 'Spot',
            {
                // allow linking from ports
                cursor: 'pointer',
                fromLinkableDuplicates: false, toLinkableDuplicates: false,
            },
            // tell gojs that this part is a port
            new go.Binding('portId', 'id'),
            new go.Binding('fromLinkable', 'id', (id, obj) => (obj as any).part.data.isConnector),
            new go.Binding('toLinkable', 'id', (id, obj) => !(obj as any).part.data.viewModeActive),
            // the REAL ports are placed at the edges of the grey box surrounding the image
            new go.Binding('alignment', 'spot', (spot, obj) => {
                spot = go.Spot.parse(spot);
                const nodeData = (obj as any).part.data;

                // the dimensions of the inner grey box
                const innerBoxHeight = nodeData.height + (!nodeData.isConnector ? INNER_BOX_VERT_PADDING : 0);
                const innerBoxWidth = nodeData.width + (!nodeData.isConnector ? INNER_BOX_HOR_PADDING : 0);

                // the dimesnions of the outer white box
                const outerBoxHeight = innerBoxHeight + OUTER_BOX_VERT_PADDING;
                const outerBoxWidth = innerBoxWidth +
                    ((obj as any).part.data.name === 'joint' ? OUTER_BOX_VERT_PADDING : OUTER_BOX_HOR_PADDING);

                // the alignment spot is given in terms of a fraction.
                // this formula transforms the fraction mentioned in equipment data so that
                // the port is placed exactly at the edge of the inner grey box
                const spotY = (((outerBoxHeight - innerBoxHeight) / 2) + (spot.y * innerBoxHeight)) / outerBoxHeight;
                const spotX = (((outerBoxWidth - innerBoxWidth) / 2) + (spot.x * innerBoxWidth)) / outerBoxWidth;
                return new go.Spot(spotX, spotY);
            }),
            // the port shape, when connected is a straight line (for most nodes)
            // this is to make it seem like the link starts from the edge of the image
            $(
                go.Shape,
                { width: 1, strokeWidth: 0, alignment: go.Spot.Center },
                new go.Binding('height', 'connected', (connected, obj) => {
                    return (connected && !(obj as any).part.data.isConnector) ? OUTER_BOX_VERT_PADDING : 0;
                }),
                new go.Binding('fill', 'id', (id, obj) => (obj as any).part.data.color || 'black')
            ),
            new go.Binding('angle')
        ));
        // define the template for the PSEUDO ports
        // these are shown as "plus" signs when node is selected
        // acts as the handle that user uses to draw links
        // no links are actually created using these ports.
        // the linkingTool has been overrided to find the REAL port and use that when making connections
        itemTemplates.add('pseudo-port', $(
            go.Panel, 'Spot',
            {
                // allow linking from ports
                cursor: 'pointer',
                toLinkable: false,
                fromLinkableDuplicates: false, toLinkableDuplicates: false,
            },
            // tell gojs that this part is a port
            // the 'id' property in the data would have a "pseudo" prefix
            new go.Binding('portId', 'id'),
            new go.Binding('fromLinkable', 'id', (id, obj) => !(obj as any).part.data.viewModeActive),
            new go.Binding('alignment', 'spot', go.Spot.parse),
            $(
                go.Panel, 'Spot',
                { alignment: go.Spot.Center },
                $(
                    go.Shape, 'Circle',
                    { alignment: go.Spot.Center, width: 16 },
                    // only show if node is selected and the REAL port is not connected
                    new go.Binding('opacity', 'connected', (connected, obj) => {
                        return (
                            (obj as any).part.data.isSelected !== false && !connected &&
                            !(obj as any).part.data.viewModeActive
                        ) ? 1 : 0;
                    }),
                ),
                $(
                    go.Shape, 'ThickCross',
                    { stroke: 'transparent', fill: '#fff', alignment: go.Spot.Center, height: 8, width: 8 },
                    // only show if node is selected and the REAL port is not connected
                    new go.Binding('opacity', 'connected', (connected, obj) => {
                        return (
                            (obj as any).part.data.isSelected !== false && !connected &&
                            !(obj as any).part.data.viewModeActive
                        ) ? 1 : 0;
                    })
                )
            ),
        ));
        // template for label, whose text is bound to node key
        itemTemplates.add('label', $(
            go.Panel,
            {
                alignment: go.Spot.TopRight,
                alignmentFocus: go.Spot.LeftCenter,
                padding: 3,
            },
            // when the label is hidden, set it's size to zero,
            new go.Binding('desiredSize', 'visible', (visible) => visible ? new go.Size(NaN, NaN) : new go.Size(0, 0)),
            $(
                go.TextBlock,
                // 'visible' governed by show/hide labels feature. Look at method: this.toggleLabels()
                // can't directly access node key from the item object, have to go to node object
                new go.Binding('text', 'visible', (visible, obj) => visible ? (obj as any).part.data.key : '')
            )
        ));
        // template for 'origin' (which is at center of object)
        itemTemplates.add('origin', $(
            go.Panel,
            { alignment: go.Spot.Center },
            $(
                go.Shape, 'Circle',
                { width: 0, opacity: 0, name: 'origin' }
            )
        ));

        // define the resize adornment template
        const resizeAdornmentTemplate = $(
            go.Adornment, 'Spot',
            $(go.Placeholder, { padding: 24 }),
            $(
                go.Panel, 'Spot',
                { alignment: go.Spot.Top,  cursor: 'row-resize', },
                $(
                    go.Shape, 'Circle',
                    { alignment: go.Spot.Center, width: 16 },
                ),
                $(
                    go.Shape, 'DoubleEndArrow',
                    { stroke: 'transparent', fill: '#fff', alignment: go.Spot.Center, height: 6, width: 10, angle: 90 },
                )
            ),
            $(
                go.Panel, 'Spot',
                { alignment: go.Spot.Bottom,  cursor: 'row-resize', },
                $(
                    go.Shape, 'Circle',
                    { alignment: go.Spot.Center, width: 16 },
                ),
                $(
                    go.Shape, 'DoubleEndArrow',
                    { stroke: 'transparent', fill: '#fff', alignment: go.Spot.Center, height: 6, width: 10, angle: 90 },
                )
            ),
        );

        // define template for when a node is selected in view mode
        const selectionAdornmentTemplate = $(
            go.Adornment, 'Spot',
            $(
                go.Panel, 'Auto',
                $(go.Shape, { fill: null, strokeWidth: 1, stroke: '#9f9f9f', strokeDashArray: [4, 4] }),
                $(go.Placeholder)
            )
        );

        // define the template of the widgets inside the diagram
        this.diagram.nodeTemplateMap.add('', $(
            go.Node, 'Spot',
            {
                // only the named specific part of the node will be resizable/rotatable
                // (otherwise for cable-circuit component the 'seals' at the end would strech too)
                resizeObjectName: 'mainPanel',
                selectionObjectName: 'greyBox',
                locationObjectName: 'origin',
                // the context menu reference created above
                contextMenu: this.contextMenu,
                // setting the previously defined item templates for ports, label and origin here
                itemCategoryProperty: 'type',
                itemTemplateMap: itemTemplates,
                selectionAdornmentTemplate: selectionAdornmentTemplate,
                selectionAdorned: false,
                resizeAdornmentTemplate: resizeAdornmentTemplate
            },
            new go.Binding('isSelected').makeTwoWay(),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            // get the ports defined in model json, and add a 'type' parameter to them
            // also add the label as an item
            new go.Binding('itemArray', 'ports', (ports, obj) => {
                // for each port mentioned in the data, add a PSEUDO port and a REAL port
                let items = ports.map(port => Object.assign({ connected: false, viewModeActive: this.viewModeActive }, port));
                if (!(obj as any).data.isConnector) {
                    items = items.concat(
                        ports.map(port => {
                            return Object.assign({ type: 'pseudo-port', connected: false }, port, { id: 'pseudo-' + port.id });
                        })
                    );
                }
                // add the label
                items.push({ type: 'label', visible: this.labelsShown });
                // add the origin
                items.push({ type: 'origin' });
                return items;
            }),
            new go.Binding('resizable', 'viewModeActive', (viewModeActive, obj) => !viewModeActive && (obj as any).data.resizable),
            new go.Binding('movable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('deletable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('copyable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            // no adornment object in edit mode! The white box that appears to adorn selected nodes, is actually part of the node
            new go.Binding('selectionAdorned', 'viewModeActive'),
            new go.Binding('angle').makeTwoWay(),
            // the panel that contains all the main elements,
            // the outer-white-box, the inner-grey-box and the image itself
            $(
                go.Panel, 'Spot',
                { alignment: go.Spot.Center },
                $(
                    go.Shape,
                    {
                        alignment: go.Spot.Center,
                        fill: '#fff',
                        stroke: '#dbdbdb',
                        strokeWidth: 1,
                    },
                    new go.Binding('figure', 'name', (name) => name === 'joint' ? 'Ellipse' : 'PillBox'),
                    new go.Binding('opacity', 'isSelected', (selected) => !selected || this.viewModeActive ? 0 : 1),
                    new go.Binding('opacity', 'viewModeActive', (viewModeActive, obj) => {
                        return !(obj as any).part.data.isSelected || viewModeActive ? 0 : 1;
                    }),
                    new go.Binding('height', 'height', (height) => height + INNER_BOX_VERT_PADDING + OUTER_BOX_VERT_PADDING),
                    new go.Binding('width', 'width', (width, obj) => {
                        return width + INNER_BOX_HOR_PADDING +
                            ((obj as any).part.data.name === 'joint' ? OUTER_BOX_VERT_PADDING : OUTER_BOX_HOR_PADDING);
                    }),
                ),
                // the inner grey box
                $(
                    go.Panel, 'Spot',
                    { name: 'greyBox', alignment: go.Spot.Center },
                    $(
                        go.Shape,
                        {
                            fill: '#dbdbdb',
                            strokeWidth: 1,
                            alignment: go.Spot.Center
                        },
                        new go.Binding('figure', 'name', (name) => name === 'joint' ? 'Ellipse' : 'RoundedRectangle'),
                        new go.Binding('stroke', 'isSelected', (selected) => selected ? '#bababa' : '#9f9f9f'),
                        new go.Binding('height', 'height', (height) => height + INNER_BOX_VERT_PADDING),
                        new go.Binding('width', 'width', (width) => width + INNER_BOX_HOR_PADDING),
                        new go.Binding('opacity', 'viewModeActive', (viewModeActive) => viewModeActive ? 0 : 1)
                    ),
                    // this is the 'named part' of the node that will be resizable
                    // the dimensions of boxes around the image are functions of the dimensions of image
                    $(
                        go.Panel, 'Spot',
                        { name: 'mainPanel', alignment: go.Spot.Center },
                        new go.Binding('height').makeTwoWay(),
                        new go.Binding('width').makeTwoWay(),
                        new go.Binding('portId', 'isConnector', (isConnector) => isConnector ? '1' : null),
                        // the image associated with each widget
                        $(
                            go.Picture,
                            new go.Binding('source', 'image')
                        )
                    )
                )
            ),
        ));

        // define the template of the text box node
        this.diagram.nodeTemplateMap.add('text-box', $(
            go.Node, 'Auto',
            {
                resizable: true,
                selectionAdorned: false,
                contextMenu: this.contextMenu,
                fromLinkable: false, toLinkable: false,
            },
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding('angle').makeTwoWay(),
            new go.Binding('height').makeTwoWay(),
            new go.Binding('width').makeTwoWay(),
            new go.Binding('resizable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('movable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('deletable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('copyable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            $(
                go.TextBlock,
                { margin: 8, editable: true },
                new go.Binding('text').makeTwoWay(),
                new go.Binding('editable', 'viewModeActive', (viewModeActive) => !viewModeActive)
            )
        ));

        const avoidUserDrawnAreaOverlap = (node, point) => {
            const bounds = node.actualBounds;
            const loc = node.location;
            // see if the area at the proposed location is unoccupied
            const x = point.x - (loc.x - bounds.x);
            const y = point.y - (loc.y - bounds.y);
            const rect = new go.Rect(x, y, bounds.width, bounds.height);
            const otherOutageAreas = this.diagram.nodes.filter(n => n.category === node.category && n.key !== node.key);
            return otherOutageAreas.any(oa => oa.actualBounds.intersectsRect(rect)) ? loc : point;
        };

        // define the template of outage area and bay nodes
        const userDrawnAreaNodeTemplate = $(
            go.Node, 'Spot',
            {
                resizable: true,
                layerName: 'Foreground',
                selectionAdorned: false,
                contextMenu: this.contextMenu,
                itemCategoryProperty: 'type',
                itemTemplateMap: itemTemplates,
                fromLinkable: false, toLinkable: false,
                dragComputation: avoidUserDrawnAreaOverlap,
                minSize: new go.Size(50, 50),
                copyable: false
            },
            new go.Binding('angle').makeTwoWay(),
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            new go.Binding('height').makeTwoWay(),
            new go.Binding('width').makeTwoWay(),
            new go.Binding('resizable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('movable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            new go.Binding('deletable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            $(
                go.Panel, 'Spot',
                { name: 'mainPanel' },
                $(
                    go.Shape, 'RoundedRectangle',
                    {
                        alignment: go.Spot.Center,
                        strokeWidth: 1, fill: 'rgba(255,255,255,0.1)'
                    },
                    new go.Binding('stroke', 'color'),
                    new go.Binding('height', 'height', (height) => height - 1),
                    new go.Binding('width', 'width', (width) => width - 1),
                ),
                $(
                    go.Shape, 'RoundedRectangle',
                    {
                        alignment: go.Spot.Center,
                        strokeWidth: 0,
                        minSize: new go.Size(42, 42)
                    },
                    new go.Binding('fill', 'backgroundColor'),
                    new go.Binding('height', 'height', (height) => height - 8),
                    new go.Binding('width', 'width', (width) => width - 8),
                ),
                $(
                    go.Panel, 'Auto',
                    {
                        padding: 8,
                        alignment: go.Spot.TopRight,
                        alignmentFocus: go.Spot.TopRight
                    },
                    new go.Binding('visible', 'width', (width, obj) => width > 1.5 * (obj as any).measuredBounds.width),
                    $(
                        go.Shape, 'PillBox',
                        { strokeWidth: 0, isPanelMain: true },
                        new go.Binding('fill', 'color')
                    ),
                    $(
                        go.TextBlock,
                        { stroke: '#fff' },
                        new go.Binding('text', 'name')
                    ),

                )
            )
        );
        this.diagram.nodeTemplateMap.add('outage-area', userDrawnAreaNodeTemplate);
        this.diagram.nodeTemplateMap.add('bay', userDrawnAreaNodeTemplate);

        // override the template of the temporary "from-node" used in linking.
        // the default is a magenta box that would surround the port object
        // this is just a blue cross that overlaps with the black cross for the PSEUDO ports
        this.diagram.toolManager.linkingTool.temporaryFromNode = $(
            go.Node, 'Spot',
            { layerName: 'Tool' },
            $(
                go.Panel, 'Spot',
                { alignment: go.Spot.Center },
                $(
                    go.Shape, 'Circle',
                    { alignment: go.Spot.Center, width: 16, fill: '#0f50ff', stroke: '#0f50ff' },
                ),
                $(
                    go.Shape, 'ThickCross',
                    { stroke: 'transparent', fill: '#fff', alignment: go.Spot.Center, height: 8, width: 8 },
                )
            ),
        );
        // override the template of the temporary "to-node" used in linking.
        // the default is a small magenta rectangle
        // Just a small black rectangle, just so user can see something
        this.diagram.toolManager.linkingTool.temporaryToNode = $(
            go.Node,
            { layerName: 'Tool' },
            $(
                go.Shape, 'Rectangle',
                { stroke: '#464646', width: 3, height: 3, fill: null }
            )
        );
        // override the template of the temporary link drawn while user is creating
        // default is a blue line with an arrowhead
        // this is a curved blue line
        this.diagram.toolManager.linkingTool.temporaryLink = $(
            go.Link,
            { layerName: 'Tool', curve: go.Link.Bezier },
            $(
                go.Shape,
                { stroke: '#0f50ff', strokeWidth: 1 }
            )
        );

        // override the goJS LinkReshapingTool's "doActivate" function
        // this is a hook called just before user starts to reshape an existing link
        // we do this to force which direction the user can reshape the link
        // TODO: Find a better hook
        const goJSLinkReshapeActivateFn = this.diagram.toolManager.linkReshapingTool.doActivate;
        this.diagram.toolManager.linkReshapingTool.doActivate = () => {
            // call the super method, which does some critical stuff
            goJSLinkReshapeActivateFn.call(this.diagram.toolManager.linkReshapingTool);
            // once the super is called, the handle being used by user is exposed
            const handle = this.diagram.toolManager.linkReshapingTool.handle;

            // get the points of the link to evaluate direction of reshape that should be allowed
            // the algo is simple, if it's a verticle segment, user can reshape horizontally and vice versa
            // also, updat the angle of the reshape-handles to reflect the correct orientiation of reshaping.
            if (handle.part.data.points.get(2).x === handle.part.data.points.get(3).x) {
                this.diagram.toolManager.linkReshapingTool.setReshapingBehavior(handle, go.LinkReshapingTool.Horizontal);
                handle.angle = 0;
            } else {
                this.diagram.toolManager.linkReshapingTool.setReshapingBehavior(handle, go.LinkReshapingTool.Vertical);
                handle.angle = 90;
            }
        };

        // override the default template of the link-rehsape-handles
        // default is a small blue box
        // this is a blue circle with the double arrow logo
        this.diagram.toolManager.linkReshapingTool.handleArchetype = $(
            go.Panel, 'Spot',
            { alignment: go.Spot.Center },
            new go.Binding('angle', 'points', (points) => points.get(2).x === points.get(3).x ? 0 : 90),
            $(
                go.Shape, 'Circle',
                { alignment: go.Spot.Center, width: 16, fill: '#0f50ff', stroke: '#0f50ff' },
            ),
            $(
                go.Shape, 'DoubleEndArrow',
                { stroke: 'transparent', fill: '#fff', alignment: go.Spot.Center, height: 6, width: 10 }
            )
        );

        // define the function that takes in a link's points and checks if it's an abnormal path
        // an "abnormal" path is defined as one in which there's a sudden 180 degree turn between points
        // or one that has a ver small segment acting like a kink in the path
        const isRouteAbnormal = (points): boolean => {
            let previousAngle = null;
            let abnormality = false;
            const arr = points.toArray();
            // iterate through the points, and find the angle each segment has in the x-y plane
            arr.forEach((point, index) => {
                if (!index) { return; }
                let angle = null;
                let segmentLength = 0;

                // routes are orthogonal, so figuring out the angle of segment is pretty straightforward
                if (point.x === arr[index - 1].x) {
                    angle = point.y > arr[index - 1].y ? 90 : - 90;
                    segmentLength = Math.abs(point.y - arr[index - 1].y);
                } else {
                    angle = point.x > arr[index - 1].x ? 0 : - 180;
                    segmentLength = Math.abs(point.x - arr[index - 1].x);
                }

                // if the angle of this segment is 180+- the previous segment (abnormal U-turn present)
                // we flag the route as abnormal
                if (Math.abs(angle - previousAngle) === 180) {
                    abnormality = true;
                }
                // if the segment is a tiny length kink,
                // we flag the route as abnormal
                // note the first and the last segments of the link are allowed to be tiny by design
                if (segmentLength < 10 && segmentLength > 0
                    && Math.abs(angle - previousAngle) === 90
                    && index < 5 && index > 1) {
                    abnormality = true;
                }
                previousAngle = angle;
            });

            return abnormality;
        };

        // function to check if a port has capcity for new links
        // this works on PSEUDO as well as REAL ports (assuming that both ports are marked as "connected" correctly)
        const isPortFull = (node, port): boolean => {
            // if node can have infinite links (it's a connector), return false
            return node.data.isConnector ? false : port.data.connected;
        };

        // get the REAL port given the PSEUDO / REAL port id
        const getRealPort = (node, portId) => {
            if (portId.indexOf('pseudo') !== -1) {
                portId = portId.match(/\d+/g)[0];
            }
            return node.ports.filter(port => port.portId === portId).first();
        };

        // get the PSEUDO port given the PSEUDO / REAL port id
        const getPseudoPort = (node, portId) => {
            if (portId.indexOf('pseudo') === -1) {
                portId = 'pseudo-' + portId;
            }
            return node.ports.filter(port => port.portId === portId).first();
        };

        // define function to check if a particular link connects that port to something
        const doesLinkConnectPort = (link, node, port) => {
            if (!link.data) { return false; }
            port = getRealPort(node, port.portId);
            return (link.data.from === node.key && link.data.fid === port.portId) ||
                (link.data.to === node.key && link.data.tid === port.portId);
        };

        // defining the function used to fix direction of links from a port
        // this is to avoid the link routing through the widget itself
        const getPortDirection = (nodeKey, link, linkProperty) => {
            const node = this.diagram.findNodeForKey(nodeKey);
            const port = node.ports
                .filter(p => (p as any).data.id === (link as any).data[linkProperty])
                .first();

            const spot = go.Spot.parse((port as any).data.spot);
            const portAngle = (port as any).data.angle;
            if (spot.x === 0) {
                return portAngle ? (portAngle > 0 ? go.Spot.Bottom : go.Spot.Top) : go.Spot.Left;
            }
            if (spot.x === 1) {
                return portAngle ? (portAngle > 0 ? go.Spot.Top : go.Spot.Bottom) : go.Spot.Right;
            }
            if (spot.y === 0) {
                return go.Spot.Top;
            }
            if (spot.y === 1) {
                return go.Spot.Bottom;
            }
        };

        // define a custom link class that behaves differently when connecting the busbar component
        class CustomLink extends go.Link {
            constructor() {
                super();
            }

            // override the get link port function
            // determines the point of connection of the link on the node / port
            getLinkPoint(node, port, spot, from, ortho, otherNode, otherPort) {
                // perform the complicated calculations only for busbars
                // this is so that the most optimal point on the bus bar is chosen
                if (node.data && node.data.isConnector) {
                    const otherPoint = super.getLinkPoint(
                        otherNode, otherPort, this.computeSpot(!from), !from, ortho, node, port
                    );
                    const otherDirection = super.getLinkDirection(
                        otherNode, otherPort, otherPoint, this.computeSpot(!from), !from, ortho, node, port
                    );
                    const portBounds = new go.Rect(
                        port.getDocumentPoint(go.Spot.TopLeft),
                        port.getDocumentPoint(go.Spot.BottomRight)
                    );
                    const portCenter = port.getDocumentPoint(go.Spot.Center);
                    const otherPortCenter = otherPort.getDocumentPoint(go.Spot.Center);
                    // if the busbar is horizontal
                    if (Math.abs(node.data.angle % 180) === 90) {
                        // the y position is the center of the black bar
                        const y = (portBounds.bottom + portBounds.top) / 2;
                        // the offset is to shift the final point slightly to get a better route
                        // default offset is 0, and default x position is the same x value of the other port
                        let offset = 0;
                        if (Math.abs(otherDirection % 180) === 90) {
                            // if the direction of the link at the other end is vertical,
                            // and pointing away from the busbar instead of towards, then
                            // shift the point of the connection on the bus bar by the width of the other component bounds
                            if ((otherPortCenter.y > portCenter.y && otherDirection === 90) ||
                                (otherPortCenter.y < portCenter.y && otherDirection === 270)) {
                                    // add / subtract the width whichever is possible
                                    offset = otherNode.actualBounds.width *
                                        (otherPoint.x + otherNode.actualBounds.width > portBounds.right ? -1 : 1);
                                }
                        } else {
                            // if direction of the link at the other end is horizontal,
                            // the offset is set to +/- 10 because that's the default "direction segment length"
                            offset = (otherDirection === 180 ? -1 : 1) * 10;
                        }
                        // maximum x point is bound by the dimesions of the busbar
                        if (otherPoint.x + offset < portBounds.left + 4) { return new go.Point(portBounds.left + 4, y); }
                        if (otherPoint.x + offset > portBounds.right - 4) { return new go.Point(portBounds.right - 4, y); }
                        return new go.Point(otherPoint.x + offset, y);
                    } else { // if the busbar is veritcal
                        // the x position is the center of the black bar
                        const x = (portBounds.left + portBounds.right) / 2;
                        let offset = 0;
                        if (Math.abs(otherDirection % 180) === 0) {
                            // if the direction of the link at the other end is horizontal,
                            // and pointing away from busbar, shift the point by height of the other component bounds
                            if ((otherPortCenter.x > portCenter.x && otherDirection === 0) ||
                                (otherPortCenter.x < portCenter.x && otherDirection === 180)) {
                                    // add / subtract the height whichever is possible
                                    offset = otherNode.actualBounds.height *
                                        (otherPoint.y + otherNode.actualBounds.height > portBounds.bottom ? -1 : 1);
                                }
                        } else {
                            // if direction of the link at the other end is vertical,
                            // the offset is set to +/- 10 because that's the default "direction segment length"
                            offset = (otherDirection === 90 ? 1 : -1) * 10;
                        }
                        // maximum y point is bound by the dimesions of the busbar
                        if (otherPoint.y + offset > portBounds.bottom - 4) { return new go.Point(x, portBounds.bottom - 4); }
                        if (otherPoint.y + offset < portBounds.top + 4) { return new go.Point(x, portBounds.top + 4); }
                        return new go.Point(x, otherPoint.y + offset);
                    }
                } else {
                    // if the node is not bus-bar, then use the super fn
                    return super.getLinkPoint(node, port, spot, from, ortho, otherNode, otherPort);
                }
            }

            getLinkDirection(node, port, linkPoint, spot, from, ortho, otherNode, otherPort) {
                if (node.data  && node.data.isConnector) {
                    const portCenter = port.getDocumentPoint(go.Spot.Center);
                    const otherPortCenter = otherPort.getDocumentPoint(go.Spot.Center);
                    if (Math.abs(node.data.angle % 180) === 90) {
                        return otherPortCenter.y > portCenter.y ? 90 : 270;
                    } else {
                        return otherPortCenter.x > portCenter.x ? 0 : 180;
                    }

                } else {
                    return super.getLinkDirection(node, port, linkPoint, spot, from, ortho, otherNode, otherPort);
                }
            }
        }

        // template for the links
        this.diagram.linkTemplate = $(
            CustomLink,
            {
                routing: go.Link.Orthogonal,
                // if two links intersect, show it like in text-book circuit-diagrams
                curve: go.Link.JumpOver,
                selectionAdorned: false,
                reshapable: true,
                copyable: false,
                deletable: false,
                toEndSegmentLength: 3,
                fromEndSegmentLength: 3
            },
            new go.Binding('fromSpot', 'from', (key, link) => getPortDirection(key, link, 'fid')),
            new go.Binding('toSpot', 'to', (key, link) => getPortDirection(key, link, 'tid')),
            new go.Binding('points').makeTwoWay(),
            // "adjusting" parameter is set to "Link.End", so that goJS respects the middle-segment and does not recalcuate it's position
            // this is important to preserve any user-made-reshaping to the link
            // otherwise, goJS would recalculate the entire route from fresh as soon as a node is moved.
            // however, setting "adjusting" value to this has a side effect: that sometimes, 'abnormal' routes are formed
            // in case the route is abnormal, we let goJS re-calculate path from scratch
            // also for any connection to a busbar, the path is recalculated always by design
            new go.Binding('adjusting', 'points', (points, obj) => {
                return (isRouteAbnormal(points) || this.diagram.findNodeForKey((obj as any).data.to).data.isConnector) ?
                    go.Link.None : go.Link.End;
            }),
            new go.Binding('isSelected').makeTwoWay(),
            new go.Binding('reshapable', 'viewModeActive', (viewModeActive) => !viewModeActive),
            $(
                go.Shape,
                new go.Binding('stroke', 'color'),
            ),
            $(
                go.Shape, 'Circle',
                {
                    toArrow: 'Circle', segmentOffset: new go.Point(4, 0),
                },
                new go.Binding('scale', 'to', (to) => this.diagram.findNodeForKey(to).data.isConnector ? 1 : 0.01),
                new go.Binding('stroke', 'color', (color, obj) => {
                    return this.diagram.findNodeForKey((obj as any).part.data.to).data.color || 'black';
                }),
                new go.Binding('fill', 'color', (color, obj) => {
                    return this.diagram.findNodeForKey((obj as any).part.data.to).data.color || 'black';
                })
            )
        );

        // defining the custom link validation fn, so that no invlaid links are made
        // invalid link is one that is a duplicate connection of ports
        // (two ports can't be connected to each other through multiple links)
        // additionally, if snapping tool is calling this function, then the restriction for a valid link is more stringent
        // in that case, no full ports are allowed to snap
        (this.diagram.toolManager.linkingTool.linkValidation as any) = (fromNode, fromPort, toNode, toPort, isSnapping?: boolean) => {
            // if called by snapping tool, say no to full ports
            if (isSnapping) {
                return !isPortFull(fromNode, fromPort) && !isPortFull(toNode, toPort);
            }

            // if there exists a link that connects both ports, it's not valid to add more links
            return this.diagram.links
                .filter(link => doesLinkConnectPort(link, fromNode, fromPort))
                .filter(link => doesLinkConnectPort(link, toNode, toPort))
                .count === 0;
        };

        // the default linking fn of gojs
        const gojsLinkingFn = this.diagram.toolManager.linkingTool.insertLink;

        // define the function that will automatically create a new connection to a full port by replacing the existing link,
        // and adding a joint component as a connector in between
        // @param: linkToRemove, node (the new node trying to come connect to the full port), port (the connecting port of said node)
        const autoAddJoint = (linkToRemove, newNode, newPort) => {
            const connections = [
                {
                    node: this.diagram.findNodeForKey(linkToRemove.data.from),
                    portId: linkToRemove.data.fid
                },
                {
                    node: this.diagram.findNodeForKey(linkToRemove.data.to),
                    portId: linkToRemove.data.tid
                }
            ];
            const removedLinkPoints = linkToRemove.points;

            // remove the existing link from the already full toPort
            (this.diagram.model as go.GraphLinksModel).removeLinkData(linkToRemove.data);

            // there are 3 connections to be made with the newly added joint.
            // algorithm to pick the correct port for each connection automatically
            const portsToConnect: any[] = [
                { node: connections[0].node, port: getRealPort(connections[0].node, connections[0].portId) },
                { node: connections[1].node, port: getRealPort(connections[1].node, connections[1].portId) },
                { node: newNode, port: newPort, newLink: true }
            ];

            // keep track of all existing nodes
            const allExistingNodeKeys = this.diagram.model.nodeDataArray.map(data => (data as any).key);
            const allExistingNodeKeysDict = {};
            allExistingNodeKeys.forEach(key => {
                allExistingNodeKeysDict[key] = true;
            });

            // properly create the new joint data object with a new unique key
            const newJointData = SldUtilService.deepCopy(
                this.palette.model.copyNodeData(
                    this.palette.model.nodeDataArray.filter(data => (data as any).name === 'joint')[0]
                )
            );
            newJointData.key = this.diagram.model.makeUniqueKeyFunction(this.diagram.model, newJointData);
            newJointData.isSelected = false;

            // add the joint component somewhere in the path of the link that was removed
            this.diagram.model.addNodeData(
                Object.assign(
                    {},
                    newJointData,
                    {
                        loc: go.Point.stringify(
                            new go.Point(
                                (removedLinkPoints.get(2).x + removedLinkPoints.get(3).x) / 2,
                                (removedLinkPoints.get(2).y + removedLinkPoints.get(3).y) / 2
                            )
                            .snapToGridPoint(this.diagram.grid.gridOrigin, this.diagram.grid.gridCellSize)
                        )
                    }
                )
            );

            // get the newly added joint node
            // const newJointData = this.diagram.model.nodeDataArray
            //     .filter(data => (data as any).name === 'joint' && !allExistingNodeKeysDict[(data as any).key])[0];
            const newJoint = this.diagram.findNodeForKey((newJointData as any).key);
            this.utilService.nodeAddedSubject.next({ autoAddedNode: newJoint });

            // define the function to get the location coords of a port on the newly added joint
            // since the joint is just been added,
            // the direct approach of getting document point of the port object doesn't work
            const getPortLocation = (p) => {
                return p.part
                    .getDocumentPoint(go.Spot.parse(p.data.spot))
                    .add(go.Point.parse(p.part.data.loc))
                    .subtract(p.part.getDocumentPoint(go.Spot.Center));
            };

            // define the function that calculates closest joint port for the given port
            // accepts a list of joint port options as parameter
            const findBestPortOption = (p, availableOptions) => {
                const optionDistances = availableOptions.map((option) => {
                    return getPortLocation(p).distanceSquaredPoint(getPortLocation(option));
                });
                const minDistance = Math.min(...optionDistances);
                return availableOptions[optionDistances.indexOf(minDistance)];
            };
            // save the array of all the joint ports (pseudo ones for distance calculation)
            const options = [];
            newJoint.ports
                .filter(option => (option as any).portId.indexOf('pseudo') !== -1)
                .each(option => options.push(option));

            // mark the preferred joint ports for each new connection
            portsToConnect.forEach(p => {
                p.preferredOption = findBestPortOption(p.port, options);
            });

            // define the function to check if any "conflicts" exist in desired joint ports
            // i.e. two connections marked for the same joint port
            const conflicts = () => {
                const preferredDict = {};
                portsToConnect.forEach(p => {
                    preferredDict[p.preferredOption.portId] = preferredDict[p.preferredOption.portId] || 0;
                    preferredDict[p.preferredOption.portId] += 1;
                });
                // if any joint port is marked twice, there is a conflict
                return Object.keys(preferredDict).filter(key => preferredDict[key] > 1);
            };

            // if two connections are desired on the same joint port conflict resolution is required
            // algo based on reducing maximum damage of a bad port pairing
            while (conflicts().length) {
                const conflictOption = options.filter(option => option.portId === conflicts()[0])[0];
                // some joint ports could already be strongly claimed by another connection
                const alreadyResolvedOptions = portsToConnect.filter(p => p.resolved).map(p => p.preferredOption);

                // available options on the joint to resolve the conflict
                const possibleNewOptions = options.filter(option => {
                    return option !== conflictOption && alreadyResolvedOptions.indexOf(option) === -1;
                });

                const competingPorts = portsToConnect.filter(p => p.preferredOption === conflictOption);
                // for each of the competing ports, calculate the "claim" they make for the preferred joint port
                // "claim" here is defined as ratio of distance to preferred joint port and distance to the second preference
                // higher the ratio, higher the damage caused by going to second preference, hence higher the claim
                competingPorts.forEach(p => {
                    p.secondPref = findBestPortOption(p.port, possibleNewOptions);
                    p.claim = getPortLocation(p.port).distanceSquaredPoint(getPortLocation(p.secondPref));
                    p.claim = p.claim / (getPortLocation(p.port)
                        .distanceSquaredPoint(getPortLocation(p.preferredOption)));
                });

                const bestClaim = Math.max( ...competingPorts.map(p => p.claim) );
                const winner = competingPorts.filter(p => p.claim === bestClaim)[0];

                // once marked resolved, this connection "strongly claims" the particular joint port,
                // and that joint port is not avaiable for any new conflict resolutions that might occur
                winner.resolved = true;
                competingPorts.filter(p => p !== winner).forEach(p => {
                    p.preferredOption = p.secondPref;
                });
            }

            // create all 3 connections to the newly added joint.
            // return the link that connects the joint to the new component being linked
            let linkToReturn = null;
            portsToConnect.forEach(p => {
                const link = gojsLinkingFn.call(this.diagram.toolManager.linkingTool,
                    newJoint, getRealPort(newJoint, p.preferredOption.portId), p.node, p.port);
                this.utilService.linkCreatedSubject.next({ subject: link });
                if (p.newLink) {
                    linkToReturn = link;
                }
            });

            return linkToReturn;
        };

        // override the goJS insertLink function
        // when links are drawn by user froma PSEUDO port, we actually want the REAL port for the connection.
        this.diagram.toolManager.linkingTool.insertLink = (fromNode, fromPort, toNode, toPort) => {
            fromPort = getRealPort(fromNode, fromPort.portId);
            toPort = getRealPort(toNode, toPort.portId);

            // if port is NOT full, then it's a simple case of adding a new link
            if (!isPortFull(toNode, toPort) && !isPortFull(fromNode, fromPort)) {
                return gojsLinkingFn.call(this.diagram.toolManager.linkingTool, fromNode, fromPort, toNode, toPort);
            }

            // else port is full, and we have to automatically add a joint element as a connector in between
            // and replace the existing link connecting the full port with new links from the joint element

            // keep track whether the from port is full before any new connections are made
            const wasFromPortFull = isPortFull(fromNode, fromPort);

            // first check if the to-node is full, if so, replace the existin link and add a joint
            let linkToReturn = null;
            if (isPortFull(toNode, toPort)) {
                const linkToRemove = this.diagram.links
                    .filter(link => doesLinkConnectPort(link, toNode, toPort)).first();
                linkToReturn = autoAddJoint(linkToRemove, fromNode, fromPort);
            }

            // next check if the from-node was full
            if (wasFromPortFull) {
                const linkToRemove = this.diagram.links
                    .filter(link => doesLinkConnectPort(link, fromNode, fromPort)).first();

                // if toPort was also full some extra steps need to be taken
                if (linkToReturn) {
                    // if new link is already created with autoJoint for the toPort,
                    // that link actually should be so as to not overload the from port

                    // get the already added joint node and port
                    const autoJointNodeKey = linkToReturn.data.from === fromNode ? linkToReturn.data.to : linkToReturn.data.from;
                    const autoJointPortId = linkToReturn.data.from === fromNode ? linkToReturn.data.tid : linkToReturn.data.fid;

                    const autoJointNode = this.diagram.findNodeForKey(autoJointNodeKey);
                    const autoJointPort = getRealPort(autoJointNode, autoJointPortId);

                    // delete the newly created link as it overloads the from port
                    (this.diagram.model as go.GraphLinksModel).removeLinkData(linkToReturn.data);
                    // add another joint near the from port end, and connect the already added joint element
                    return autoAddJoint(linkToRemove, autoJointNode, autoJointPort);

                }

                return autoAddJoint(linkToRemove, toNode, toPort);
            }

            return linkToReturn;

        };

    }

    /**
     * the component after view init
     * gives the element ref to GoJS
     */
    ngAfterViewInit() {
        this.diagram.div = this.diagramRef.nativeElement;
    }

}
