/// <reference path="..\..\Typings\google.maps.d.ts" />
/// <reference path="Interfaces.d.ts" />

import G = google.maps;
import VM = require("Scripts/NE/Model");
import T = require("Scripts/NE/Controller");

if (!Array.prototype.remove) {
    Array.prototype.remove = function<T> (item: any) {
        var me: Array<T> = this;
        var index = me.indexOf(item);

        me.splice(index, 1);
    }
}

export class NetworkEditor {
    map: G.Map;
    private controller: T.Controller;
    model: IModel;
    trackers: any;

    constructor(public mapDiv: HTMLElement, public styles: any) {
        this.map = new G.Map(mapDiv, {
            zoom: 6,
            center: new G.LatLng(40, 40),
            mapTypeId: G.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            draggable: false,
            zoomControl: false,
            scrollwheel: true,
            disableDoubleClickZoom: true
        });

        this.model = new VM.Model(this.map);
        this.controller = new T.Controller(this, this.map, this.mapDiv, this.model);

        this.trackers = {
            'pointer': new T.DefaultTracker(this.controller, n => styles['draggedvertex'](n)),
            'pan': new T.ScrollTracker(this.controller)
        }

        this.setMode('pan');
    }

    resize(width: number, height: number) {
        this.mapDiv.style.width = width + 'px';
        this.mapDiv.style.height = height + 'px';
        G.event.trigger(this.map, 'resize');
    }

    private bindToHovered(target: IEditorObject) {
        T.bind(this, target.getView(), 'mousedown', (ev) => this.controller.hovered = target);
        T.bind(this, target.getView(), 'mouseup', (ev) =>   this.controller.hovered = target);
        T.bind(this, target.getView(), 'mousemove', (ev) => this.controller.hovered = target);
        T.bind(this, target.getView(), 'mouseout', (ev) =>  this.controller.hovered = null);
    }

    createVertexStyle(icon) {
        var image = new google.maps.MarkerImage(icon);
        image.anchor = new google.maps.Point(8, 8);

        return {
            icon: image,
            cursor: 'default',
            draggable: false
        };
    }

    newEdgeTracker(key: string, createDmEdge: (sa, sz) => any): () => Tracker {
        return () => {
            var edgeTracker = new T.EdgeTracker(this.controller);

            edgeTracker.createNew = (va, vz) =>
            {
                var dmEdge = createDmEdge(va.dmObject, vz.dmObject);
                var edge = this.model.createEdge(va, vz, (n) => this.styles[key](n), dmEdge);

                this.bindToHovered(edge);

                return edge;
            }

            return edgeTracker;
        }
    }

    newVertexTracker(key: string, createDmVertex: (position: G.LatLng) => any): () => Tracker {
        return () => {
            var nodeTracker = new T.VertexTracker(this.controller);

            nodeTracker.createNew = (p) => {
                var dmVertex = createDmVertex(p);
                var vertex = this.model.createVertex(p, (n) => this.styles[key](n), dmVertex);

                this.bindToHovered(vertex);

                return vertex;
            };

            return nodeTracker;
        }
    }

    setMode(value) {
        this.controller.tracker = this.trackers[value];
    }
}
