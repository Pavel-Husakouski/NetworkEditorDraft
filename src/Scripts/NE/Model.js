/// <reference path="..\..\Typings\google.maps.d.ts" />
/// <reference path="Interfaces.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports"], function(require, exports) {
    var G = google.maps;

    function assert(condition) {
        if (!condition())
            alert(condition.toString());
    }
    exports.assert = assert;

    var Model = (function () {
        function Model(map) {
            this.map = map;
            this.selection = new Selection();
            this.edges = [];
            this.verteces = [];
        }
        Model.prototype.selectWithinBounds = function (bounds, combine) {
            var objects = [];
            var hash = new Object();

            this.verteces.forEach(function (v) {
                if (bounds.contains(v.getPosition())) {
                    objects.push(v);
                    hash[v.getId()] = v;
                }
            });

            this.edges.forEach(function (e) {
                if (hash[e.vertexA.getId()] && hash[e.vertexZ.getId()]) {
                    objects.push(e);
                }
            });

            this.selection.select(objects, combine);
        };

        Model.prototype.createEdge = function (va, vz, style, dmObject) {
            var edge = new Edge(va, vz, style, this.map);

            edge.dmObject = dmObject;
            this.edges.push(edge);

            this.raiseAdded(edge);

            return edge;
        };

        Model.prototype.createVertex = function (pos, style, dmObject) {
            var vertex = new Vertex(style, pos, this.map);

            vertex.dmObject = dmObject;
            this.verteces.push(vertex);

            this.raiseAdded(vertex);

            return vertex;
        };

        Model.prototype.raiseAdded = function (obj) {
            this.addedHandler(obj, this);
        };

        Model.prototype.addedHandler = function (obj, sender) {
        };
        return Model;
    })();
    exports.Model = Model;

    var Selection = (function () {
        function Selection() {
            this.items = [];
        }
        Selection.prototype.raiseChanged = function () {
            this.changedHandler(this.getItems(), this);
        };

        Selection.prototype.changedHandler = function (items, sender) {
        };

        Selection.prototype._clear = function () {
            this.items.forEach(function (item, i) {
                item.selected = false;
            });
            this.items = [];
        };

        Selection.prototype.getItems = function () {
            return this.items.slice(0);
        };

        Selection.prototype.clear = function () {
            this._clear();
            this.raiseChanged();
        };
        Selection.prototype.toggle = function (obj) {
            if (obj.selected)
                this.deselect(obj);
            else
                this.select([obj], true);
        };

        Selection.prototype.select = function (list, combine) {
            var _this = this;
            var newList = [];
            var hash = new Object();

            if (!combine)
                this._clear();
            newList = this.items.concat(list);
            this.items = [];
            newList.forEach(function (x) {
                if (list[x.getId()])
                    return;
                list[x.getId()] = x;
                _this.items.push(x);
            });
            list.forEach(function (item) {
                return item.selected = true;
            });
            this.raiseChanged();
        };

        Selection.prototype.deselect = function (obj) {
            if (!obj.selected)
                return;
            obj.selected = false;

            this.items.remove(obj);
            this.raiseChanged();
        };
        return Selection;
    })();
    exports.Selection = Selection;

    var ModelObject = (function () {
        function ModelObject() {
            this.instanceId = (ModelObject._id++) + "ModelObject";
        }
        ModelObject.prototype.getId = function () {
            return this.instanceId;
        };

        Object.defineProperty(ModelObject.prototype, "selected", {
            get: function () {
                return this._selected;
            },
            set: function (value) {
                this._selected = value;
                this.selected_changed();
            },
            enumerable: true,
            configurable: true
        });
        ModelObject.prototype.selected_changed = function () {
        };

        ModelObject.prototype.actualStyle = function () {
            return this.selected ? 'selected' : 'regular';
        };

        ModelObject.prototype.getView = function () {
        };
        ModelObject._id = 0;
        return ModelObject;
    })();
    exports.ModelObject = ModelObject;

    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(style, pos, map) {
            _super.call(this);
            this.style = style;
            this.instanceId = (Vertex._id++) + "Vertex";
            this.connections = [];
            var s = style('regular');

            s.position = pos;
            s.map = map;
            this.marker = new G.Marker(s);
        }
        Vertex.prototype.getId = function () {
            return this.instanceId;
        };

        Vertex.prototype.selected_changed = function () {
            var name = this.actualStyle();
            var style = this.style(name);

            this.marker.setOptions(style);
        };

        Vertex.prototype.connect = function (edge) {
            this.connections.push(edge);
        };

        Vertex.prototype.getView = function () {
            return this.marker;
        };

        Vertex.prototype.getPosition = function () {
            return this.marker.getPosition();
        };

        Vertex.prototype.setPosition = function (pos) {
            this.marker.setPosition(pos);
            this.position_changed();
        };

        Vertex.prototype.position_changed = function () {
            this.connections.forEach(function (edge) {
                edge.updatePath();
            });
        };
        Vertex._id = 0;
        return Vertex;
    })(ModelObject);
    exports.Vertex = Vertex;

    var Edge = (function (_super) {
        __extends(Edge, _super);
        function Edge(vertexA, vertexZ, style, map) {
            _super.call(this);
            this.vertexA = vertexA;
            this.vertexZ = vertexZ;
            this.style = style;
            this.instanceId = (Edge._id++) + "Edge";
            exports.assert(function () {
                return vertexA !== vertexZ;
            });

            this.line = new G.Polyline(style('regular'));
            this.line.setMap(map);
            this.updatePath();
            vertexA.connect(this);
            vertexZ.connect(this);
        }
        Edge.prototype.getId = function () {
            return this.instanceId;
        };

        Edge.prototype.updatePath = function () {
            var va = this.vertexA;
            var vz = this.vertexZ;

            this.line.setPath([va.getPosition(), vz.getPosition()]);
        };

        Edge.prototype.selected_changed = function () {
            this.line.setOptions(this.style(this.actualStyle()));
        };

        Edge.prototype.getView = function () {
            return this.line;
        };
        Edge._id = 0;
        return Edge;
    })(ModelObject);
    exports.Edge = Edge;
});
//# sourceMappingURL=Model.js.map
