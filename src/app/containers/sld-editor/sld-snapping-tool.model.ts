import * as go from 'gojs';
import { SldUtilService } from './services/util.service';

/**
 * custom DraggingTool for 'snap-linking' while dragging widgets close by
 */
export class SldSnappingTool extends go.DraggingTool {

    private snapOffset: any;
    // parent member variables
    public diagram: any;
    public copiedParts: any;

    constructor(private utilService: SldUtilService) {
        super();
    }

    /**
     * overriden moveParts method
     * checks if there are any nearby ports the dragged items should snap to
     * adds the required snap offset and calls the super()
     * @param parts the parts being dragged
     * @param offset the drag offset
     */
    public moveParts(parts, offset, check) {

        // on mouse up use the offset that was calculated during the drag
        if (this.snapOffset && this.isActive && this.diagram.lastInput.up && parts === this.copiedParts) {
            go.DraggingTool.prototype.moveParts.call(this, parts, this.snapOffset, check);
            this.snapOffset = undefined;
            return;
        }

        let finalOffset = offset;

        // find out if any snapping is desired for any Node being dragged
        const partsIter = parts.iterator;
        while (partsIter.next()) {
            const node = partsIter.key;
            if (!(node instanceof go.Node && !node.category && (node.data && !node.data.isConnector))) {
                continue;
            }

            const info = partsIter.value;
            const newLocation = info.point.copy().add(offset);
            // now calculate snap point for this Node
            const snapoffset = newLocation.copy().subtract(node.location);

            let nearbyPorts, closestPort, closestPortPoint, nodePort = null;
            let closestDistance = 20 * 20;
            const portsIter = node.ports.filter(port => port.portId.indexOf('pseudo') !== -1);
            while (portsIter.next()) {
                const port = portsIter.value;
                // ignore ports already linked with the node
                if (node.findLinksConnected(port.portId).count > 0) {
                    continue;
                }
                const portPoint = port.getDocumentPoint(go.Spot.Center);
                // where it would be without snapping
                portPoint.add(snapoffset);
                if (!nearbyPorts) {

                    // this collectionects the Nodes that intersect with the node's bounds,
                    // excluding nodes that are being dragged (i.e. in the parts collectionection)
                    const nearbyParts = this.diagram.findObjectsIn(
                        node.actualBounds,
                        x => x.part,
                        p => !parts.contains(p) && !p.category,
                        true);

                    // gather a collectionection of GraphObjects that are stationary 'ports' for this NODE
                    nearbyPorts = new go.Set();
                    nearbyParts.each((n) => {
                        if (n instanceof go.Node) {
                            nearbyPorts.addAll(n.ports.filter(nPort => nPort.portId.indexOf('pseudo') === -1));
                        }
                    });
                }

                // find the closest port among the set of nearby ports
                const nearbyPortsIter = nearbyPorts.iterator;
                while (nearbyPortsIter.next()) {
                    const nearbyPort = nearbyPortsIter.value;
                    const nearbyPortPoint = nearbyPort.getDocumentPoint(go.Spot.Center);
                    const distance = nearbyPortPoint.distanceSquaredPoint(portPoint);
                    const validLink  = this.diagram.toolManager.linkingTool.linkValidation(node, port, nearbyPort.part, nearbyPort, true);
                    if (distance < closestDistance && validLink) {
                        closestDistance = distance;
                        closestPort = nearbyPort;
                        closestPortPoint = nearbyPortPoint;
                        nodePort = port;
                    }
                }
            }
            // found something to snap to!
            if (closestPort) {
                // move the node so that the ports coincide
                const nodePortRel = nodePort.getDocumentPoint(go.Spot.Center).subtract(node.location);
                const snapPoint = closestPortPoint.copy().subtract(nodePortRel);
                // save the offset, to ensure everything moves together
                finalOffset = snapPoint.subtract(newLocation).add(offset);
                // ignore any node.dragComputation function
                // ignore any node.minLocation and node.maxLocation
                break;
            }
        }
        // now do the standard movement with the single (perhaps snapped) offset
        this.snapOffset = finalOffset.copy();  // remember for mouse-up when copying
        go.DraggingTool.prototype.moveParts.call(this, parts, finalOffset, check);
    }


    /**
     * overriden doDropOnto method
     * called when dragged collection is dropped
     * handles linking of ports (if needed)
     * @param point of drop
     * @param obj being dropped
     */
    public doDropOnto(point, obj) {
        go.DraggingTool.prototype.doDropOnto.call(this, point, obj);

        // Need to iterate over all of the dropped nodes to see which ports happen to be snapped to stationary ports
        const collection = this.copiedParts || this.draggedParts;
        const collectionIter = collection.iterator;
        while (collectionIter.next()) {
            const node = collectionIter.key;
            if (!(node instanceof go.Node && !node.category && (node.data && !node.data.isConnector))) {
                continue;
            }

            // connect all snapped ports of this node (yes, there might be more than one) with links
            const portsIter = node.ports;
            while (portsIter.next()) {
                const port = portsIter.value;
                // maybe add a link -- see if the port is at another port that is compatible
                const portPoint = port.getDocumentPoint(go.Spot.Center);
                if (!portPoint.isReal()) {
                    continue;
                }
                const nearbyPorts =
                    this.diagram.findObjectsAt(
                        portPoint,
                        x => {
                            // walk up the chain of panels
                            while (x !== null && x.portId === null) {
                                x = x.panel;
                            }
                            return x;
                        },
                        p => {
                            // the parent Node must not be in the dragged collectionection
                            if (p.category) { return false; }
                            if (collection.contains(p.part)) { return false; }
                            const nearbyPortPoint = p.getDocumentPoint(go.Spot.Center);
                            if (portPoint.distanceSquaredPoint(nearbyPortPoint) >= 4) { return false; }
                            return true;
                        }
                    );

                const nearbyPort = nearbyPorts
                    // only ports with which a valid link can be drawn
                    .filter(nPort => this.diagram.toolManager.linkingTool.linkValidation(node, port, nPort.part, nPort, true))
                    .first();

                if (nearbyPort) {
                    // connect the node's port with the other port found at the same point
                    const link = this.diagram.toolManager.linkingTool.insertLink(node, port, nearbyPort.part, nearbyPort);
                    // broadcast an update event so that sld-editor will refresh images
                    this.utilService.specialUserActionSubject.next();
                    this.utilService.linkCreatedSubject.next({ subject: link });
                }
            }
        }
    }
}
