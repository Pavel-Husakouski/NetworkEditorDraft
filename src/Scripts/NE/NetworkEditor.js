/// <reference path="..\..\Typings\google.maps.d.ts" />
/// <reference path="Interfaces.d.ts" />
define(["require", "exports", "Scripts/NE/Model", "Scripts/NE/Controller"], function(require, exports, VM, T) {
    var G = google.maps;

    if (!Array.prototype.remove) {
        Array.prototype.remove = function (item) {
            var me = this;
            var index = me.indexOf(item);

            me.splice(index, 1);
        };
    }

    var NetworkEditor = (function () {
        function NetworkEditor(mapDiv, styles) {
            this.mapDiv = mapDiv;
            this.styles = styles;
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
                'pointer': new T.DefaultTracker(this.controller, function (n) {
                    return styles['draggedvertex'](n);
                }),
                'pan': new T.ScrollTracker(this.controller)
            };

            this.setMode('pan');
        }
        NetworkEditor.prototype.resize = function (width, height) {
            this.mapDiv.style.width = width + 'px';
            this.mapDiv.style.height = height + 'px';
            G.event.trigger(this.map, 'resize');
        };

        NetworkEditor.prototype.bindToHovered = function (target) {
            var _this = this;
            T.bind(this, target.getView(), 'mousedown', function (ev) {
                return _this.controller.hovered = target;
            });
            T.bind(this, target.getView(), 'mouseup', function (ev) {
                return _this.controller.hovered = target;
            });
            T.bind(this, target.getView(), 'mousemove', function (ev) {
                return _this.controller.hovered = target;
            });
            T.bind(this, target.getView(), 'mouseout', function (ev) {
                return _this.controller.hovered = null;
            });
        };

        NetworkEditor.prototype.createVertexStyle = function (icon) {
            var image = new google.maps.MarkerImage(icon);
            image.anchor = new google.maps.Point(8, 8);

            return {
                icon: image,
                cursor: 'default',
                draggable: false
            };
        };

        NetworkEditor.prototype.newEdgeTracker = function (key, createDmEdge) {
            var _this = this;
            return function () {
                var edgeTracker = new T.EdgeTracker(_this.controller);

                edgeTracker.createNew = function (va, vz) {
                    var dmEdge = createDmEdge(va.dmObject, vz.dmObject);
                    var edge = _this.model.createEdge(va, vz, function (n) {
                        return _this.styles[key](n);
                    }, dmEdge);

                    _this.bindToHovered(edge);

                    return edge;
                };

                return edgeTracker;
            };
        };

        NetworkEditor.prototype.newVertexTracker = function (key, createDmVertex) {
            var _this = this;
            return function () {
                var nodeTracker = new T.VertexTracker(_this.controller);

                nodeTracker.createNew = function (p) {
                    var dmVertex = createDmVertex(p);
                    var vertex = _this.model.createVertex(p, function (n) {
                        return _this.styles[key](n);
                    }, dmVertex);

                    _this.bindToHovered(vertex);

                    return vertex;
                };

                return nodeTracker;
            };
        };

        NetworkEditor.prototype.setMode = function (value) {
            this.controller.tracker = this.trackers[value];
        };
        return NetworkEditor;
    })();
    exports.NetworkEditor = NetworkEditor;
});
//# sourceMappingURL=NetworkEditor.js.map
