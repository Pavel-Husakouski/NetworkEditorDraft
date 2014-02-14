/// <reference path="..\..\Typings\google.maps.d.ts" />
/// <reference path="Interfaces.d.ts" />

import G = google.maps;

export function assert(condition: () => boolean) {
    if (!condition())
        alert(condition.toString());
}

export class Model implements IModel {
    selection = new Selection();
    private edges: Edge[] = [];
    private verteces: Vertex[] = [];
    constructor(private map: G.Map) {

    }

    selectWithinBounds(bounds: G.LatLngBounds, combine?: boolean) {
        var objects = [];
        var hash: any = new Object();

        this.verteces.forEach(v => {
            if (bounds.contains(v.getPosition())) {
                objects.push(v);
                hash[v.getId()] = v;
            }
        });

        this.edges.forEach(e => {
            if (hash[e.vertexA.getId()] && hash[e.vertexZ.getId()]) {
                objects.push(e);
            }
        });

        this.selection.select(objects, combine);
    }

    createEdge(va: IVertex, vz: IVertex, style: (n: string) => google.maps.PolylineOptions, dmObject: any): IEdge {
        var edge = new Edge(va, vz, style, this.map);

        edge.dmObject = dmObject;
        this.edges.push(edge);

        this.raiseAdded(edge);

        return edge;
    }

    createVertex(pos: google.maps.LatLng, style: (n: string) => google.maps.MarkerOptions, dmObject: any): IVertex {
        var vertex = new Vertex(style, pos, this.map);

        vertex.dmObject = dmObject;
        this.verteces.push(vertex);

        this.raiseAdded(vertex);

        return vertex;
    }

    private raiseAdded(obj: IEditorObject) {
        this.addedHandler(obj, this);
    }

    addedHandler(obj: IEditorObject, sender: any) { }
}

export class Selection {
    private items: IEditorObject[] = [];

    private raiseChanged() {
        this.changedHandler(this.getItems(), this);
    }

    changedHandler(items: IEditorObject[], sender: any) {
    }

    private _clear() {
        this.items.forEach((item, i) => { item.selected = false });
        this.items = [];
    }

    getItems(): IEditorObject[] {
        return this.items.slice(0);
    }

    clear() {
        this._clear();
        this.raiseChanged();
    }
    toggle(obj: IEditorObject) {
        if (obj.selected)
            this.deselect(obj);
        else
            this.select([obj], true);
    }

    select(list: IEditorObject[], combine?: boolean) {
        var newList = [];
        var hash = new Object();

        if (!combine)
            this._clear();
        newList = this.items.concat(list);
        this.items = [];
        newList.forEach(x => {
            if (list[x.getId()])
                return;
            list[x.getId()] = x;
            this.items.push(x);
        });
        list.forEach(item => item.selected = true);
        this.raiseChanged();
    }

    deselect(obj: IEditorObject) {
        if (!obj.selected)
            return;
        obj.selected = false;

        this.items.remove(obj);
        this.raiseChanged();
    }
}

export class ModelObject implements IEditorObject {
    getId() { return this.instanceId; }
    static _id = 0;
    public instanceId:string = (ModelObject._id++) + "ModelObject";
    dmObject: any;

    private _selected: boolean;

    get selected() { return this._selected; }
    set selected(value) {
        this._selected = value;
        this.selected_changed();
    }
    selected_changed() { }

    actualStyle() {
        return this.selected ? 'selected' : 'regular';
    }

    getView() { }
}

export class Vertex extends ModelObject implements IVertex {
    getId(): string { return this.instanceId; } static _id = 0; instanceId: string = (Vertex._id++) + "Vertex";
    private marker: G.Marker;
    private connections: Edge[] = [];
    constructor(public style: (n: string) => G.MarkerOptions, pos: G.LatLng, map: G.Map) {
        super();
        var s = style('regular');

        s.position = pos;
        s.map = map;
        this.marker = new G.Marker(s);
    }

    selected_changed() {
        var name = this.actualStyle();
        var style = this.style(name);

        this.marker.setOptions(style);
    }

    connect(edge: IEdge) {
        this.connections.push(<Edge>edge);
    }

    getView() {
        return this.marker;
    }

    getPosition() {
        return this.marker.getPosition();
    }

    setPosition(pos: G.LatLng) {
        this.marker.setPosition(pos);
        this.position_changed();
    }

    position_changed() {
        this.connections.forEach((edge) => {
            edge.updatePath();
        });
    }
}

export class Edge extends ModelObject implements IEdge {
    getId() { return this.instanceId; }
    static _id = 0;
    instanceId = (Edge._id++) + "Edge";
    line: G.Polyline;
    constructor(public vertexA: IVertex, public vertexZ: IVertex, public style: (n: string) => G.PolylineOptions, map: G.Map) {
        super();
        assert(() => vertexA !== vertexZ);

        this.line = new G.Polyline(style('regular'));
        this.line.setMap(map);
        this.updatePath();
        vertexA.connect(this);
        vertexZ.connect(this);
    }

    updatePath() {
        var va = <Vertex>this.vertexA;
        var vz = <Vertex>this.vertexZ;

        this.line.setPath([va.getPosition(), vz.getPosition()]);
    }

    selected_changed() {
        this.line.setOptions(this.style(this.actualStyle()));
    }

    getView() {
        return this.line;
    }
}
