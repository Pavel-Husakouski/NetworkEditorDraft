/// <reference path="..\..\Typings\google.maps.d.ts" />
/// <reference path="Interfaces.d.ts" />
define(["require", "exports", "Scripts/NE/Model"], function(require, exports, VM) {
    var G = google.maps;

    function bindDom(me, el, event, method) {
        G.event.addDomListener(el, event, function (ev) {
            return method.apply(me, arguments);
        });
    }
    exports.bindDom = bindDom;

    function bind(me, el, event, method) {
        G.event.addListener(el, event, function (ev) {
            return method.apply(me, arguments);
        });
    }
    exports.bind = bind;

    var ViewPort = (function () {
        function ViewPort(ctx, map, mapDiv) {
            this.ctx = ctx;
            this.map = map;
            this.mapDiv = mapDiv;
            this.transform = new G.OverlayView();
            this.transform.draw = function () {
            };
            this.transform.setMap(map);
        }
        ViewPort.prototype.autoscroll = function () {
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
        };

        ViewPort.prototype.startAutoScroll = function () {
            var _this = this;
            this.timerId = setInterval(function () {
                _this.autoscroll();
            }, 50);
        };
        ViewPort.prototype.stopAutoScroll = function () {
            clearInterval(this.timerId);
        };

        ViewPort.prototype.getClientRect = function () {
            return this.mapDiv.getBoundingClientRect();
        };

        ViewPort.prototype.clientToBox = function (point) {
            var rect = this.getClientRect();

            return new G.Point(point.x - rect.left, point.y - rect.top);
        };

        ViewPort.prototype.clientToLatLng = function (client) {
            var projection = this.transform.getProjection;

            if (!projection)
                return new G.LatLng(0, 0);

            var point = this.clientToBox(client);

            return projection.apply(this.transform).fromContainerPixelToLatLng(point);
        };

        ViewPort.prototype.latLngToPixel = function (latLng) {
            throw "Not implemented";
        };

        ViewPort.prototype.clientContains = function (point) {
            var rect = this.getClientRect();

            return rect.left < point.x && point.x < rect.right && rect.top < point.y && point.y < rect.bottom;
        };
        return ViewPort;
    })();

    var LastInput = (function () {
        function LastInput(viewPort, ev, old) {
            this.viewPort = viewPort;
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
        return LastInput;
    })();

    var Controller = (function () {
        function Controller(control, map, mapDiv, model) {
            this.control = control;
            this.map = map;
            this.model = model;
            this.begin = null;
            this.end = null;
            this.active = false;
            this.viewPort = new ViewPort(this, map, mapDiv);
            this._input = new LastInput(this.viewPort);

            exports.bindDom(this, document, 'mousedown', this.onMouseDown);
            exports.bindDom(this, document, 'mouseup', this.onMouseUp);
            exports.bindDom(this, document, 'mousemove', this.onMouseMove);
        }
        Controller.prototype.startAutoScroll = function () {
            this.viewPort.startAutoScroll();
        };

        Controller.prototype.stopAutoScroll = function () {
            this.viewPort.stopAutoScroll();
        };

        Object.defineProperty(Controller.prototype, "lastModifiers", {
            get: function () {
                return { keyCtrl: this._input.keyCtrl, keyAlt: this._input.keyAlt, keyShift: this._input.keyShift };
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Controller.prototype, "lastLatLng", {
            get: function () {
                return this._input.latLng;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Controller.prototype, "lastPoint", {
            get: function () {
                return this._input.point;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Controller.prototype, "hovered", {
            get: function () {
                return this._input.hovered;
            },
            set: function (value) {
                this._input.hovered = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Controller.prototype, "tracker", {
            get: function () {
                return this._tracker;
            },
            set: function (value) {
                this._tracker = value;
            },
            enumerable: true,
            configurable: true
        });


        Controller.prototype.updateInput = function (ev) {
            this._input = new LastInput(this.viewPort, ev, this._input);
        };

        Controller.prototype.onMouseUp = function (ev) {
            this.updateInput(ev);

            if (!this.viewPort.clientContains({ x: ev.clientX, y: ev.clientY }) && !this.active)
                return;

            this.end = this.lastLatLng;
            this.active = false;

            this.tracker.end();
        };

        Controller.prototype.onMouseDown = function (ev) {
            var e = (ev || window.event);

            if (!this.viewPort.clientContains({ x: e.clientX, y: e.clientY }))
                return;

            this.updateInput(ev);
            this.begin = this.lastLatLng;
            this.end = this.lastLatLng;
            this.active = true;

            this.tracker.begin();
        };

        Controller.prototype.onMouseMove = function (ev) {
            this.updateInput(ev);
            var beginPoint = this.begin;

            if (!beginPoint)
                beginPoint = this.lastLatLng;
            else if (!this.active)
                beginPoint = this.lastLatLng;

            this.begin = beginPoint;
            this.end = this.lastLatLng;
            this.tracker.processing();
        };
        return Controller;
    })();
    exports.Controller = Controller;

    var EmptyTracker = (function () {
        function EmptyTracker() {
        }
        EmptyTracker.prototype.begin = function () {
        };
        EmptyTracker.prototype.end = function () {
        };
        EmptyTracker.prototype.processing = function () {
        };
        return EmptyTracker;
    })();
    exports.EmptyTracker = EmptyTracker;

    var DefaultTracker = (function () {
        function DefaultTracker(ctx, nodeStyle) {
            this.ctx = ctx;
            this.nodeStyle = nodeStyle;
        }
        DefaultTracker.prototype.reset = function () {
            this.tracker = null;
            this.startPoint = null;
            this.target = null;
        };

        DefaultTracker.prototype.isNoDrag = function () {
            if (!this.startPoint)
                return true;

            var end = this.ctx.lastPoint;

            return Math.abs(end.x - this.startPoint.x) < 7 && Math.abs(end.y - this.startPoint.y) < 7;
        };

        DefaultTracker.prototype.begin = function () {
            if (this.tracker) {
                this.tracker.begin();
                return;
            }

            if (!this.startPoint) {
                this.startPoint = this.ctx.lastPoint;
                this.target = this.ctx.hovered;

                return;
            }
        };

        DefaultTracker.prototype.end = function () {
            if (this.tracker)
                this.tracker.end();
            else
                this.processClick();

            this.reset();
        };

        DefaultTracker.prototype.processClick = function () {
            if (!this.target) {
                if (!this.ctx.lastModifiers.keyCtrl)
                    this.ctx.model.selection.clear();
                return;
            }

            if (this.ctx.lastModifiers.keyCtrl)
                this.ctx.model.selection.toggle(this.target);
            else
                this.ctx.model.selection.select([this.target]);
        };

        DefaultTracker.prototype.processing = function () {
            var _this = this;
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

                rectTracker.completed = function () {
                    _this.ctx.model.selectWithinBounds(rectTracker.bounds(), _this.ctx.lastModifiers.keyCtrl);
                };
            }

            this.tracker.begin();
        };
        return DefaultTracker;
    })();
    exports.DefaultTracker = DefaultTracker;

    var DragTracker = (function () {
        function DragTracker(ctx, target, style) {
            var _this = this;
            this.ctx = ctx;
            this.style = style;
            if (target.selected)
                this.target = ctx.model.selection.getItems().filter(function (x) {
                    return x instanceof VM.Vertex;
                });
            else
                this.target = [target];
            this.dragMarkers = this.target.map(function (x) {
                var marker = new G.Marker(_this.style('dragged'));

                marker.setMap(_this.ctx.map);

                return marker;
            });
        }
        DragTracker.prototype.begin = function () {
            this.ctx.startAutoScroll();
        };
        DragTracker.prototype.end = function () {
            var _this = this;
            this.dragMarkers.forEach(function (x) {
                return x.setMap(null);
            });
            this.target.forEach(function (x, i) {
                return x.setPosition(_this.dragMarkers[i].getPosition());
            });
            this.ctx.stopAutoScroll();
        };
        DragTracker.prototype.processing = function () {
            var _this = this;
            var dlat = this.ctx.end.lat() - this.ctx.begin.lat();
            var dlng = this.ctx.end.lng() - this.ctx.begin.lng();

            this.dragMarkers.forEach(function (x, i) {
                var pos = _this.target[i].getPosition();

                x.setPosition(new G.LatLng(pos.lat() + dlat, pos.lng() + dlng));
            });
        };
        return DragTracker;
    })();

    var ScrollTracker = (function () {
        function ScrollTracker(ctx) {
            this.ctx = ctx;
        }
        ScrollTracker.prototype.begin = function () {
        };
        ScrollTracker.prototype.end = function () {
        };
        ScrollTracker.prototype.processing = function () {
            if (!this.ctx.active)
                return;

            var dlat = this.ctx.begin.lat() - this.ctx.end.lat();
            var dlng = this.ctx.begin.lng() - this.ctx.end.lng();
            var center = this.ctx.map.getCenter();
            var newCenter = new G.LatLng(center.lat() + dlat, center.lng() + dlng);

            this.ctx.map.setCenter(newCenter);
        };
        return ScrollTracker;
    })();
    exports.ScrollTracker = ScrollTracker;

    var RectTracker = (function () {
        function RectTracker(ctx) {
            this.ctx = ctx;
            this._rectangle = new G.Rectangle({ strokeColor: 'navy', fillColor: 'navy' });
        }
        RectTracker.prototype.bounds = function () {
            var bounds = new G.LatLngBounds();

            bounds.extend(this.ctx.begin);
            bounds.extend(this.ctx.end);

            return bounds;
        };

        RectTracker.prototype.render = function () {
            this._rectangle.setBounds(this.bounds());

            this._rectangle.setMap(this.ctx.active ? this.ctx.map : null);
        };

        RectTracker.prototype.begin = function () {
            this.ctx.startAutoScroll();
        };
        RectTracker.prototype.end = function () {
            this.render();
            this.ctx.stopAutoScroll();
            this.completed();
        };
        RectTracker.prototype.processing = function () {
            this.render();
        };

        RectTracker.prototype.completed = function () {
        };
        return RectTracker;
    })();
    exports.RectTracker = RectTracker;

    var EdgeTracker = (function () {
        function EdgeTracker(ctx) {
            this.ctx = ctx;
            this._line = new G.Polyline();
        }
        EdgeTracker.prototype.render = function () {
            if (!this.vertexA)
                return;

            this._line.setPath([this.vertexA.getPosition(), this.ctx.end]);
            this._line.setMap(this.ctx.active ? this.ctx.map : null);
        };

        EdgeTracker.prototype.begin = function () {
            if (!(this.ctx.hovered && this.ctx.hovered instanceof VM.Vertex))
                return;

            this.vertexA = this.ctx.hovered;
            this.render();

            this.ctx.startAutoScroll();
        };

        EdgeTracker.prototype.end = function () {
            this.render();
            this.ctx.stopAutoScroll();

            var vertexA = this.vertexA;
            var vertexZ = this.ctx.hovered;

            try  {
                if (vertexA && vertexZ && vertexA !== vertexZ)
                    this.createNew(vertexA, vertexZ);
            } finally {
                this.reset();
            }
        };

        EdgeTracker.prototype.reset = function () {
            this.vertexA = null;
        };

        EdgeTracker.prototype.processing = function () {
            if (!this.vertexA)
                return;

            this.render();
        };
        return EdgeTracker;
    })();
    exports.EdgeTracker = EdgeTracker;

    var VertexTracker = (function () {
        function VertexTracker(ctx) {
            this.ctx = ctx;
        }
        VertexTracker.prototype.begin = function () {
        };

        VertexTracker.prototype.end = function () {
            this.createNew(this.ctx.end);
        };

        VertexTracker.prototype.processing = function () {
        };
        return VertexTracker;
    })();
    exports.VertexTracker = VertexTracker;
});
//# sourceMappingURL=Controller.js.map
