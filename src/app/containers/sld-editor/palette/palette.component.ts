import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import * as go from 'gojs';

/**
 * the palette component
 */
@Component({
    selector: 'sld-palette',
    styleUrls: ['./palette.component.scss'],
    templateUrl: './palette.component.html'
})
export class PaletteComponent implements OnInit, AfterViewInit {

    @Input() palette: go.Diagram;
    @Input() hoverPalette: go.Diagram;
    @Input()
    set containerHeight(containerHeight: number) {
        const maxPaletteHeight = containerHeight - 240;
        while (this.paletteHeight > maxPaletteHeight) {
            this.paletteHeight -= 76;
        }
        while (this.paletteHeight + 76 < maxPaletteHeight) {
            this.paletteHeight += 76;
        }
    }

    // if the standard changes, we need to update the hover palette width
    // as there are two fewer transformers in ANSI mode
    // also goJS needs to be updated of the new canvas width
    @Input()
    set standard(standard: string) {
        setTimeout(() => {
            this.hoverPaletteWidth = standard === 'iec' ? 216 : 132;
            // show div with opacity 0 so it's not visible and update goJS
            this.hoverPaletteOpacity = 0;
            this.showHoverPalette = true;
            this.hoverPalette.requestUpdate();
            // bring things back to normal
            setTimeout(() => {
                this.hoverPaletteOpacity = 1;
                this.showHoverPalette = false;
            }, 100);
        }, 100);
    }

    @ViewChild('paletteDiv')
    private paletteRef: ElementRef;
    @ViewChild('hoverPaletteDiv')
    private hoverPaletteRef: ElementRef;

    @ViewChild('hoverPaletteContainer')
    private hoverPaletteContainerRef: ElementRef;

    public showHoverPalette = true;
    // controlling the opacity as during app load
    // hover palette should be with correct dimensions, but not visible
    public hoverPaletteOpacity = 0;
    public hoverPaletteTopOffset = 228;
    public hoverPaletteWidth = 216;
    public paletteHeight = 460;

    /**
     * the component init
     * mainly defines the diagram templates
     */
    ngOnInit() {
        const $ = go.GraphObject.make;

        this.palette.allowHorizontalScroll = false;
        this.palette.allowZoom = false;
        this.palette.toolManager.hoverDelay = 100;
        this.palette.toolManager.contextMenuTool.defaultTouchContextMenu = null;

        this.hoverPalette.allowHorizontalScroll = false;
        this.hoverPalette.allowVerticalScroll = false;
        this.hoverPalette.allowZoom = false;
        this.hoverPalette.toolManager.hoverDelay = 100;
        this.hoverPalette.toolManager.contextMenuTool.defaultTouchContextMenu = null;

        // define a different node template for the palette
        // (with a lot of the features missing, as we don't want it here)
        this.palette.nodeTemplate = $(
            go.Node, 'Spot',
            {
                // notice how the item template doesn't define the generic circle shape
                // that's because we only want to display the port if it's an image
                itemTemplate: $(
                    go.Panel,
                    new go.Binding('alignment', 'spot', go.Spot.parse),
                    $(
                        go.Picture,
                        new go.Binding('source', 'image')
                    )
                ),
                // define the tooltip for each node that displays the key
                toolTip: $(
                    go.Adornment, 'Auto',
                    $(
                        go.Shape,
                        { fill: '#FFFFCC' }
                    ),
                    $(
                        go.TextBlock,
                        { margin: 4 },
                        new go.Binding('text', 'name')
                    )
                ),
                selectionAdorned: false
            },
            {
                mouseHover: (e, obj) => {
                    if (obj.data.clusterHead) {
                        this.showHoverPalette = true;
                    }
                    this.hoverPaletteTopOffset =  223 - this.palette.position.y;
                }
            },
            new go.Binding('angle'),
            new go.Binding('itemArray', 'ports'),
            $(
                go.Panel, 'Spot',
                { alignment: go.Spot.Center },
                $(
                    go.Shape, 'RoundedRectangle',
                    {
                        fill: '#dbdbdb',
                        strokeWidth: 1,
                        alignment: go.Spot.Center,
                        stroke: '#9f9f9f'
                    },
                    new go.Binding('height', 'height', (height) => height + 16),
                    new go.Binding('width', 'width', (width) => width),
                ),
                // this is the 'named part' of the node that will be resizable
                // the dimensions of boxes around the image are functions of the dimensions of image
                $(
                    go.Panel, 'Spot',
                    { name: 'mainPanel', alignment: go.Spot.Center },
                    new go.Binding('height'),
                    new go.Binding('width'),
                    // the image associated with each widget
                    $(
                        go.Picture,
                        new go.Binding('source', 'image')
                    )
                )
            ),
            $(
                go.TextBlock,
                { height: 64, width: 32 },
                new go.Binding('text').makeTwoWay()
            )
        );

        this.hoverPalette.nodeTemplateMap = this.palette.nodeTemplateMap;

    }

    /**
     * the component after view init
     * gives the element ref to GoJS, and align nodes
     */
    ngAfterViewInit() {
        this.palette.div = this.paletteRef.nativeElement;
        this.hoverPalette.div = this.hoverPaletteRef.nativeElement;

        // neatly align the widgets in palette
        const layout = this.palette.layout as go.GridLayout;
        layout.sorting = go.GridLayout.Forward;
        layout.cellSize = new go.Size(33, 33);

        // hide the hover paletteRef div
        // it's initially displayed (with 0 opacity), so that the goJS can measure bounds of div and paint components
        setTimeout(() => {
            this.showHoverPalette = false;
            this.hoverPaletteOpacity = 1;
        });

        this.hoverPaletteContainerRef.nativeElement.addEventListener('mouseleave', () => {
            this.showHoverPalette = false;
        });
    }

}
