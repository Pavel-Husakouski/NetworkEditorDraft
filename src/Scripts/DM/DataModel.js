/// <reference path="../../typings/google.maps.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports"], function(require, exports) {
    var Node = (function (_super) {
        __extends(Node, _super);
        function Node(position, name) {
            _super.call(this);
            this.position = position;
            this.name = name;
            this.atypeEdgeNeighbours = [];
            this.bTypeEdgeNeighbours = [];
            this.lat = position.lat();
            this.lng = position.lng();
        }
        return Node;
    })(google.maps.MVCObject);
    exports.Node = Node;

    var ATypeEdge = (function (_super) {
        __extends(ATypeEdge, _super);
        function ATypeEdge(nodeA, nodeZ, name) {
            _super.call(this);
            this.nodeA = nodeA;
            this.nodeZ = nodeZ;
            this.name = name;
        }
        return ATypeEdge;
    })(google.maps.MVCObject);
    exports.ATypeEdge = ATypeEdge;

    var BTypeEdge = (function (_super) {
        __extends(BTypeEdge, _super);
        function BTypeEdge(nodeA, nodeZ, name) {
            _super.call(this);
            this.nodeA = nodeA;
            this.nodeZ = nodeZ;
            this.name = name;
        }
        return BTypeEdge;
    })(google.maps.MVCObject);
    exports.BTypeEdge = BTypeEdge;

    var Network = (function (_super) {
        __extends(Network, _super);
        function Network(nodes, aTypeEdges, bTypeEdges) {
            if (typeof nodes === "undefined") { nodes = []; }
            if (typeof aTypeEdges === "undefined") { aTypeEdges = []; }
            if (typeof bTypeEdges === "undefined") { bTypeEdges = []; }
            _super.call(this);
            this.nodes = nodes;
            this.aTypeEdges = aTypeEdges;
            this.bTypeEdges = bTypeEdges;
            this.name = "Network";
        }
        Network.prototype.addNode = function (s) {
            this.nodes[s.name] = s;
        };

        Network.prototype.addatypeEdge = function (f) {
            this.aTypeEdges[f.name] = f;

            if (f.nodeA.atypeEdgeNeighbours.indexOf(f.nodeZ) == -1) {
                f.nodeA.atypeEdgeNeighbours.push(f.nodeZ);
            }
            if (f.nodeZ.atypeEdgeNeighbours.indexOf(f.nodeA) == -1) {
                f.nodeZ.atypeEdgeNeighbours.push(f.nodeA);
            }
        };

        Network.prototype.addBType = function (s) {
            this.bTypeEdges[s.name] = s;

            if (s.nodeA.bTypeEdgeNeighbours.indexOf(s.nodeZ) == -1) {
                s.nodeA.bTypeEdgeNeighbours.push(s.nodeZ);
            }
            if (s.nodeZ.bTypeEdgeNeighbours.indexOf(s.nodeA) == -1) {
                s.nodeZ.bTypeEdgeNeighbours.push(s.nodeA);
            }
        };
        return Network;
    })(google.maps.MVCObject);
    exports.Network = Network;
});
//# sourceMappingURL=DataModel.js.map
