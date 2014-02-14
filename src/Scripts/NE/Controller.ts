/// <reference path="..\..\Typings\google.maps.d.ts" />
/// <reference path="Interfaces.d.ts" />
                                             
import G = google.maps;
import VM = require("Scripts/NE/Model");

export function bindDom(me: any, el: any, event: string, method: (ev: MouseEvent) => void ) {
    G.event.addDomListener(el, event, ev => method.apply(me, arguments));
}

export function bind(me: any, el: any, event: string, method: (ev: MouseEvent) => void ) {
    G.event.addListener(el, event, ev => method.apply(me, arguments));
}

class ViewPort {
    timerId: number;

    private autoscroll() {
        var point = this.ctx.lastPoint;
        var rect = this.getClientRect();
        var xDelta = rect.width * 0.01;
        var yDelta = rect.height * 0.01;
        var centerX = rect.left + (rect.width / 2.0);
        var centerY = rect.top + (rect.height / 2.0);

        centerX += point.x > rect.right ? xDelta : 0;
        centerX -= point.x < rect.left ? xDelta : 0;
        centerY += point.y > rect.bottom ? yDelta : 0;
        centerY -= point.y < rect.top ? yDelta : 0;

        this.ctx.map.setCenter(this.clientToLatLng({ x: centerX, y: centerY }));
    }

    public startAutoScroll() { this.timerId = setInterval(() => { this.autoscroll() }, 50); }
    public stopAutoScroll() { clearInterval(this.timerId); }

    private transform = new G.OverlayView();

    constructor(public ctx: Controller, public map: G.Map, public mapDiv: HTMLElement) {
        this.transform.draw = () => { };
        this.transform.setMap(map);
    }

    public getClientRect() {
        return this.mapDiv.getBoundingClientRect();
    }

    private clientToBox(point: Point) {
        var rect = this.getClientRect();

        return new G.Point(point.x - rect.left, point.y - rect.top);
    }

    clientToLatLng(client: Point) {
        var projection = this.transform.getProjection;

        if (!projection)
            return new G.LatLng(0, 0);

        var point = this.clientToBox(client);

        return projection.apply(this.transform).fromContainerPixelToLatLng(point);
    }

    latLngToPixel(latLng) {
        throw "Not implemented";
    }

    clientContains(point) {
        var rect = this.getClientRect();

        return rect.left < point.x && point.x < rect.right && rect.top < point.y && point.y < rect.bottom;
    }
}

class LastInput {
    latLng: G.LatLng;
    point: G.Point;
    hovered: IEditorObject;
    keyAlt: boolean ;
    keyCtrl: boolean;
    keyShift: boolean;

    constructor(private viewPort: ViewPort, ev?: MouseEvent, old?: LastInput) {
        if (ev) {
            var point = new G.Point(ev.clientX, ev.clientY);

            this.latLng = this.viewPort.clientToLatLng(point);
            this.point = point;
            this.keyAlt = ev.altKey;
            this.keyCtrl = ev.ctrlKey;
            this.keyShift = ev.shiftKey;
        }

        if (old)
            this.hovered = old.hovered;
    }
}

export class Controller {
    begin: G.LatLng = null;
    end: G.LatLng = null;
    active = false;
    private _tracker: Tracker;
    private _input: LastInput;
    private viewPort: ViewPort;

    constructor(public control: any, public map: google.maps.Map, mapDiv: HTMLElement, public model: IModel) {
        this.viewPort = new ViewPort(this, map, mapDiv);
        this._input = new LastInput(this.viewPort);

        bindDom(this, document, 'mousedown', this.onMouseDown);
        bindDom(this, document, 'mouseup', this.onMouseUp);
        bindDom(this, document, 'mousemove', this.onMouseMove);
    }

    startAutoScroll() {
        this.viewPort.startAutoScroll();
    }

    stopAutoScroll() {
        this.viewPort.stopAutoScroll();
    }

    get lastModifiers() {
        return { keyCtrl: this._input.keyCtrl, keyAlt: this._input.keyAlt, keyShift: this._input.keyShift }
    }

    get lastLatLng() {
        return this._input.latLng;
    }

    get lastPoint() {
        return this._input.point;
    }

    get hovered() {
        return this._input.hovered;
    }

    set hovered(value: IEditorObject) {
        this._input.hovered = value;
    }


    get tracker() {
        return this._tracker;
    }

    set tracker(value) {
        this._tracker = value;
    }

    updateInput(ev: MouseEvent) {
        this._input = new LastInput(this.viewPort, ev, this._input);
    }

    private onMouseUp(ev: MouseEvent) {
        this.updateInput(ev);

        if (!this.viewPort.clientContains({ x: ev.clientX, y: ev.clientY }) && !this.active)
            return;

        this.end = this.lastLatLng;
        this.active = false;

        this.tracker.end();
    }

    private onMouseDown(ev: MouseEvent) {
        var e: MouseEvent = <MouseEvent>(ev || window.event);

        if (!this.viewPort.clientContains({ x: e.clientX, y: e.clientY }))
            return;

        this.updateInput(ev);
        this.begin = this.lastLatLng;
        this.end = this.lastLatLng;
        this.active = true;

        this.tracker.begin();
    }

    private onMouseMove(ev: MouseEvent) {
        this.updateInput(ev);
        var beginPoint = this.begin;

        if (!beginPoint)
            beginPoint = this.lastLatLng;
        else if (!this.active)
            beginPoint = this.lastLatLng;

        this.begin = beginPoint;
        this.end = this.lastLatLng;
        this.tracker.processing();
    }
}

export class EmptyTracker implements Tracker {
    begin() { }
    end() { }
    processing() { }
}

export class DefaultTracker implements Tracker {
    constructor(private ctx: Controller, private nodeStyle: (n: string) => G.MarkerOptions) {
    }

    tracker: Tracker;
    startPoint: G.Point;
    target: IEditorObject;


    private reset() {
        this.tracker = null;
        this.startPoint = null;
        this.target = null;
    }

    private isNoDrag() {
        if (!this.startPoint)
            return true;

        var end = this.ctx.lastPoint;

        return Math.abs(end.x - this.startPoint.x) < 7 && Math.abs(end.y - this.startPoint.y) < 7;
    }

    begin() {
        if (this.tracker) {
            this.tracker.begin();
            return;
        }

        if (!this.startPoint) {
            this.startPoint = this.ctx.lastPoint;
            this.target = this.ctx.hovered;

            return;
        }
    }

    end() {
        if (this.tracker)
            this.tracker.end();
        else
            this.processClick();

        this.reset();
    }

    processClick() {
        if (!this.target) {
            if (!this.ctx.lastModifiers.keyCtrl)
                this.ctx.model.selection.clear();
            return;
        }

        if (this.ctx.lastModifiers.keyCtrl)
            this.ctx.model.selection.toggle(this.target);
        else
            this.ctx.model.selection.select([this.target]);
    }

    processing() {
        if (this.tracker) {
            this.tracker.processing();
            return;
        }

        if (!this.startPoint)
            return;
        if (this.isNoDrag())
            return;
        if (this.target)
            this.tracker = new DragTracker(this.ctx, this.target, this.nodeStyle);
        else {
            var rectTracker = this.tracker = new RectTracker(this.ctx);

            rectTracker.completed = () => {
                this.ctx.model.selectWithinBounds(rectTracker.bounds(), this.ctx.lastModifiers.keyCtrl);
            }
        }

        this.tracker.begin();
    }
}

class DragTracker implements Tracker {
    private target: VM.Vertex[];
    private dragMarkers: google.maps.Marker[];

    constructor(private ctx: Controller, target: IEditorObject, public style: (n: string) => G.MarkerOptions) {
        if (target.selected)
            this.target = <VM.Vertex[]>ctx.model.selection.getItems().filter(x => x instanceof VM.Vertex);
        else
            this.target = [<VM.Vertex>target];
        this.dragMarkers = this.target.map(x => {
            var marker = new G.Marker(this.style('dragged'));

            marker.setMap(this.ctx.map);

            return marker;
        });
    }

    begin() {
        this.ctx.startAutoScroll();
    }
    end() {
        this.dragMarkers.forEach(x => x.setMap(<G.Map>null));
        this.target.forEach((x, i) => x.setPosition(this.dragMarkers[i].getPosition()));
        this.ctx.stopAutoScroll();
    }
    processing() {
        var dlat = this.ctx.end.lat() - this.ctx.begin.lat();
        var dlng = this.ctx.end.lng() - this.ctx.begin.lng();

        this.dragMarkers.forEach((x, i) => {
            var pos = this.target[i].getPosition();

            x.setPosition(new G.LatLng(pos.lat() + dlat, pos.lng() + dlng));
        });
    }
}

export class ScrollTracker implements Tracker {
    constructor(private ctx: Controller) {
    }

    begin() {
    }
    end() {
    }
    processing() {
        if (!this.ctx.active)
            return;

        var dlat = this.ctx.begin.lat() - this.ctx.end.lat();
        var dlng = this.ctx.begin.lng() - this.ctx.end.lng();
        var center = this.ctx.map.getCenter();
        var newCenter = new G.LatLng(center.lat() + dlat, center.lng() + dlng);

        this.ctx.map.setCenter(newCenter);
    }
}

export class RectTracker implements Tracker {
    constructor(private ctx: Controller) {
    }
    _rectangle = new G.Rectangle({ strokeColor: 'navy', fillColor: 'navy' });


    bounds() {
        var bounds = new G.LatLngBounds();

        bounds.extend(this.ctx.begin);
        bounds.extend(this.ctx.end);

        return bounds;
    }

    private render() {
        this._rectangle.setBounds(this.bounds());

        this._rectangle.setMap(this.ctx.active ? this.ctx.map : null);
    }

    begin() {
        this.ctx.startAutoScroll();
    }
    end() {
        this.render();
        this.ctx.stopAutoScroll();
        this.completed();
    }
    processing() {
        this.render();
    }

    completed() { }
}

export class EdgeTracker implements Tracker {
    _line = new G.Polyline();

    constructor(private ctx: Controller) {
    }

    private render() {
        if (!this.vertexA)
            return;

        this._line.setPath([this.vertexA.getPosition(), this.ctx.end]);
        this._line.setMap(this.ctx.active ? this.ctx.map : null);
    }

    private vertexA: VM.Vertex;

    begin() {
        if (!(this.ctx.hovered && this.ctx.hovered instanceof VM.Vertex))
            return;

        this.vertexA = <VM.Vertex>this.ctx.hovered;
        this.render();

        this.ctx.startAutoScroll();
    }

    createNew: (va: IVertex, vz: IVertex) => IEdge;

    end() {
        this.render();
        this.ctx.stopAutoScroll();

        var vertexA = this.vertexA;
        var vertexZ = <VM.Vertex>this.ctx.hovered;

        try {
            if (vertexA && vertexZ && vertexA !== vertexZ)
                this.createNew(vertexA, vertexZ);
        }
        finally {
            this.reset();
        }
    }

    reset() {
        this.vertexA = null;
    }

    processing() {
        if (!this.vertexA)
            return;

        this.render();
    }
}

export class VertexTracker implements Tracker {
    constructor(public ctx: Controller)
    { }

    begin() {
    }

    createNew: (pos: G.LatLng) => IVertex;

    end() {
        this.createNew(this.ctx.end);
    }

    processing() {
    }
}
