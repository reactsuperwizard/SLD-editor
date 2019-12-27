import * as go from 'gojs';
import { SldUtilService } from './services/util.service';

// Custom mouse tool for creating outage areas by dragging mouse
export class DragCreatingTool extends go.Tool {

    public name = 'DragCreatingTool';
    public _archetypeNodeData = null;
    public _box: any;
    public _delay = 175;
    public _utilService: SldUtilService;

    constructor(private utilService: SldUtilService) {
        super();
    }

    /**
     * compute box bounds
     * ensure that the outage area doesn't overlap with any other outage area
     */
    computeBoxBounds() {
        const start = this.diagram.firstInput.documentPoint;
        const latest = this.diagram.lastInput.documentPoint;
        const desiredRect = new go.Rect(start, latest);
        const otherUserDrawnRects = this.diagram.nodes
            .filter(node => node.category === (this as any).archetypeNodeData.category)
            // keeping some padding to take into account stroke width
            .map(node => {
                const bounds = node.actualBounds;
                bounds.left -= 3;
                bounds.right += 3;
                bounds.top -= 3;
                bounds.bottom += 3;
                return bounds;
            });

        if (otherUserDrawnRects.any(bounds => bounds.intersectsRect(desiredRect))) {
            return null;
        }
        return desiredRect;
    }

    /**
     * insert part
     * called on mouse up, insert the outage area with the correct data object
     * @param the desired bounds of the part to be inserted
     */
    insertPart(bounds) {
        const archetypeNodeData = (this as any).archetypeNodeData;

        this.startTransaction(this.name);
        const data = this.diagram.model.copyNodeData(archetypeNodeData);
        this.diagram.model.addNodeData(data);
        const part = this.diagram.findPartForData(data);
        part.position = bounds.position;
        part.resizeObject.desiredSize = bounds.size;
        // select part that was just inserted
        this.diagram.select(part);

        // set the TransactionResult before raising event, in case it changes the result or cancels the tool
        this.transactionResult = this.name;
        this.stopTransaction();

        this.utilService.userAreaDrawnSubject.next();

        return part;
    }

    /**
     * overriden method: can start
     * check if tool can be activated
     */
    canStart() {
        if (!this.isEnabled) { return false; }

        // gotta have some node data that can be copied
        if (!(this as any).archetypeNodeData) { return false; }

        const e = this.diagram.lastInput;
        // require left button & that it has moved far enough away from the mouse down point, so it isn't a click
        if (!e.left) { return false; }
        // don't include the following checks when this tool is running modally
        if (this.diagram.currentTool !== this) {
            if (!this.isBeyondDragSize()) { return false; }
            // must wait for 'delay' milliseconds before that tool can run
            if (e.timestamp - this.diagram.firstInput.timestamp < (this as any).delay) { return false; }
        }
        return true;
    }

    /**
     * overriden method: do activate
     * initialize the tool
     */
    doActivate() {
        this.isActive = true;
        this.diagram.isMouseCaptured = true;
        this.diagram.add((this as any).box);
        this.doMouseMove();
    }

    /**
     * overriden method: do de-activate
     * cleanup
     */
    doDeactivate() {
        this.diagram.remove((this as any).box);
        this.diagram.isMouseCaptured = false;
        this.isActive = false;
    }

    /**
     * overriden method: do mouse move
     * find the desired rect drawn by user,
     * check if it overlaps outage area, if yes, do nothing!
     */
    doMouseMove() {
        if (this.isActive && (this as any).box !== null) {
            const desiredRect = this.computeBoxBounds();
            // user wants an overlap
            if (!desiredRect) { return; }

            const shape = (this as any).box.findObject('mainShape') || (this as any).box.findMainElement();
            shape.desiredSize = desiredRect.size;
            (this as any).box.position = desiredRect.position;
        }
    }

    /**
     * overriden method: on mouse up
     * insert part and remove the temp node
     */
    doMouseUp() {
        if (this.isActive) {
            try {
                this.diagram.currentCursor = 'wait';
                this.insertPart((this as any).box.actualBounds);
                this.diagram.remove((this as any).box);
            } finally {
                this.diagram.currentCursor = '';
            }
        }
        this.stopTool();
    }
}


// defining all the new properties we would like goJs to recognize
// so tha the edtiro can set thesee like for a normal tool
Object.defineProperty(DragCreatingTool.prototype, 'box', {
    get: function() { return this._box; },
    set: function(val) { this._box = val; }
});
Object.defineProperty(DragCreatingTool.prototype, 'delay', {
    get: function() { return this._delay; },
    set: function(val) { this._delay = val; }
});
Object.defineProperty(DragCreatingTool.prototype, 'archetypeNodeData', {
    get: function() { return this._archetypeNodeData; },
    set: function(val) { this._archetypeNodeData = val; }
});
Object.defineProperty(DragCreatingTool.prototype, 'utilService', {
    get: function() { return this._utilService; },
    set: function(service) { this._utilService = service; }
});
