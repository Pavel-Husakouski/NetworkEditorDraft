/// <reference path="../../typings/google.maps.d.ts" />

export class Node extends google.maps.MVCObject {
    atypeEdgeNeighbours:Node[] = [];
    bTypeEdgeNeighbours:Node[] = [];
    lat: number;
    lng: number;

    constructor(public position: google.maps.LatLng, public name?:string) {
        super()
        this.lat = position.lat();
        this.lng = position.lng();
    }
}

export class ATypeEdge extends google.maps.MVCObject {
    constructor(public nodeA: Node, public nodeZ: Node, public name?:string) {
        super();
    }
}

export class BTypeEdge extends google.maps.MVCObject {
    constructor(public nodeA: Node, public nodeZ: Node, public name?:string) {
        super();
    }
}

export class Network extends google.maps.MVCObject {

    name = "Network";

    constructor(public nodes: Node[] = [], public aTypeEdges: ATypeEdge[] = [], public bTypeEdges: BTypeEdge[] = [])
    { 
        super();
    }

    addNode(s: Node) {
        this.nodes[s.name] = s;
    }

    addatypeEdge(f: ATypeEdge) {
        this.aTypeEdges[f.name] = f;

        if (f.nodeA.atypeEdgeNeighbours.indexOf(f.nodeZ) == -1) {
            f.nodeA.atypeEdgeNeighbours.push(f.nodeZ);
        }
        if (f.nodeZ.atypeEdgeNeighbours.indexOf(f.nodeA) == -1) {
            f.nodeZ.atypeEdgeNeighbours.push(f.nodeA);
        }
    }

    addBType(s: BTypeEdge) {
        this.bTypeEdges[s.name] = s;

        if (s.nodeA.bTypeEdgeNeighbours.indexOf(s.nodeZ) == -1) {
            s.nodeA.bTypeEdgeNeighbours.push(s.nodeZ);
        }
        if (s.nodeZ.bTypeEdgeNeighbours.indexOf(s.nodeA) == -1) {
            s.nodeZ.bTypeEdgeNeighbours.push(s.nodeA);
        }
    }
}
