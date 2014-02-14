/// <reference path="../typings/google.maps.d.ts" />
/// <reference path="../typings/MarkerClusterer.d.ts" />
/// <reference path="../typings/google.maps.d.ts" />

import DM = require("Scripts/DM/DataModel");

export function ShowOnMap(s: String, objectType: string) {
    if (objectType == "node")
        Toolbox.importNodes(GMapTest.network, s);
    if (objectType == "atypeEdge")
        Toolbox.importATypeEdges(GMapTest.network, s);
     if (objectType == "bTypeEdge")
        Toolbox.importBTypes(GMapTest.network, s);

    GMapTest.redrawNetwork();
}

class Toolbox {
    static importNodes(net: DM.Network, data: String): void {

        if (!data) {
            //log.error('Nothing to load');
            return;
        }

        var lines = data.split('\r\n');
        var loaded = 0;
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE;

        for (var i = 0; i < lines.length; i++) {
            var str = lines[i];
            if (str[0] == '#') {
                continue;
            }
            var values = str.split('\t');
            if (values.length < 10) {
                continue;
            }
            var name = values[0];
            if (!name) {
                continue;
            }
            var physX = parseFloat(values[9]);
            var physY = parseFloat(values[10]);
            if (!physX || !physY) {
                continue;
            }
            var s = new DM.Node(new google.maps.LatLng(physY, physX));
            s.name = name;

            minX = Math.min(minX, physX);
            minY = Math.min(minY, physY);
            maxX = Math.max(maxX, physX);
            maxY = Math.max(maxY, physY);

            net.addNode(s);
            loaded++;
        }

        // Normalize node positions to current view port
        var mapBounds = GMapTest.map.getBounds();
        var xx = mapBounds.getSouthWest().lng();
        var yy = mapBounds.getSouthWest().lat();
        var kx = (maxX - minX) / (mapBounds.getNorthEast().lng() - xx);
        var ky = (maxY - minY) / (mapBounds.getNorthEast().lat() - yy);

        for (var n in net.nodes) {
            if(!net.nodes.hasOwnProperty(n))
                continue;
            var s2 = net.nodes[n];
            s2.position = new google.maps.LatLng(
              yy + (s2.position.lat() - minY) / ky,
              xx + (s2.position.lng() - minX) / kx);
        }

        // log.info(loaded + ' nodes imported');
    }

    static importATypeEdges(net: DM.Network, data: String): void {
        if (!data) {
            //log.error('Nothing to load');
            return;
        }

        var lines = data.split('\r\n');
        var loaded = 0;

        for (var i = 0; i < lines.length; i++) {
            var str = lines[i];
            if (str[0] == '#') {
                continue;
            }
            var values = str.split('\t');
            if (values.length < 14) {
                continue;
            }
            var nodeAName = values[13];
            var nodeZName = values[14];
            var atypeEdgeName = values[0];

            if (!nodeAName || !nodeZName || !atypeEdgeName) {
                continue;
            }

            var nodeA = net.nodes[nodeAName];
            var nodeZ = net.nodes[nodeZName];

            if (!nodeA || !nodeZ) {
                continue;
            }

            var f = new DM.ATypeEdge(nodeA, nodeZ);
            f.name = atypeEdgeName;

            net.addatypeEdge(f);
            loaded++;
        }
    }

    static importBTypes(net: DM.Network, data: String): void {
        if (!data) {
            //log.error('Nothing to load');
            return;
        }

        var lines = data.split('\r\n');
        var loaded = 0;

        for (var i = 0; i < lines.length; i++) {
            var str = lines[i];
            if (str[0] == '#') {
                continue;
            }
            var values = str.split('\t');
            if (values.length < 20) {
                continue;
            }
            var nodeAName = values[17];
            var nodeZName = values[20];
            var bTypeEdgeName = values[0];

            if (!nodeAName || !nodeZName || !bTypeEdgeName) {
                continue;
            }

            var nodeA = net.nodes[nodeAName];
            var nodeZ = net.nodes[nodeZName];

            if (!nodeA || !nodeZ) {
                continue;
            }

            var s = new DM.BTypeEdge(nodeA, nodeZ, bTypeEdgeName);

            net.addBType(s);
            loaded++;
        }

        //log.info(loaded + ' bTypeEdges imported');
    }
}

export function init(neMap: google.maps.Map): void {
    var mapOptions = {
        center: new google.maps.LatLng(-34.397, 150.644),
        zoom: 8,
        mapTypeId: google.maps.MapTypeId.TERRAIN
    };

    GMapTest.map = neMap;
    GMapTest.map.setOptions(mapOptions);
    GMapTest.network = new DM.Network();
    GMapTest.nodeIcon = new google.maps.MarkerImage(
      '/resources/Images/Node.png',
      new google.maps.Size(32, 32),
      new google.maps.Point(0, 0),
      new google.maps.Point(11, 16));
}

export function getNetwork() : any
{ 
    return GMapTest.network ;
}

class GMapTest {
    public static map: google.maps.Map = null;
    private static clusterer: MarkerClusterer;
    public static markers: google.maps.Marker[];
    public static linkOverlays: google.maps.Polyline[] = [];
    public static nodeIcon: google.maps.MarkerImage;

    public static network: DM.Network = null;

    static redrawNetwork(): void {
        if (GMapTest.markers && GMapTest.markers.length > 0) {
            for (var i in GMapTest.markers) {
                if (!GMapTest.markers.hasOwnProperty(i))
                    continue;
                GMapTest.markers[i].setMap(null);
            }
        }
        GMapTest.markers = [];

        for (i in GMapTest.network.nodes) {
            if (!GMapTest.network.nodes.hasOwnProperty(i))
                continue;
            var s2 = GMapTest.network.nodes[i];
            var marker = new google.maps.Marker({
                position: s2.position,
                icon: GMapTest.nodeIcon,
                title: s2.name
            });
            // marker.setMap(map);
            marker.set('node', s2);
            GMapTest.markers.push(marker);
        }
        GMapTest.clusterer = new MarkerClusterer(GMapTest.map, GMapTest.markers, { maxZoom: 14 });

        google.maps.event.addListener(GMapTest.clusterer, 'clusteringbegin', (mc: MarkerClusterer) => {
            //log.profile('Clustering');
        });
        google.maps.event.addListener(GMapTest.clusterer, 'clusteringend', (mc: MarkerClusterer) => {
            //log.profile('Clustering');
            GMapTest.repaintLines(GMapTest.clusterer);
        });
    }

    private static randomPoint(bounds: google.maps.LatLngBounds) {
        var x = bounds.getSouthWest().lat();
        var y = bounds.getNorthEast().lng();
        var width = Math.abs(bounds.getNorthEast().lat() - bounds.getSouthWest().lat());
        var height = Math.abs(bounds.getNorthEast().lng() - bounds.getSouthWest().lng());

        return new google.maps.LatLng(
          Math.random() * width + x,
          y - Math.random() * height);
    }

    private static createMarker(node: DM.Node) {
        return new google.maps.Marker({
            position: node.position,
            icon: 'resources/Images/Node.png',
            draggable: true,

        });
    }

    private static randomIndex(range: number) {
        return Math.round(Math.random() * (range - 1));
    }

    private static repaintLines(mc: MarkerClusterer) {
        if (GMapTest.linkOverlays && GMapTest.linkOverlays.length) {
            for (var j = 0; j < this.linkOverlays.length; j++) {
                GMapTest.linkOverlays[j].setMap(null);
            }
        }
        GMapTest.linkOverlays = []

        var clusters = mc.getClusters();
        //document.getElementById('map-status').innerText = 'Clusters: ' + clusters.length;
        for (var i = 0; i < clusters.length; i++) {
            for (var j = i + 1; j < clusters.length; j++) {
                var clusterA = clusters[i];
                var clusterZ = clusters[j];
                var hasatypeEdge: boolean = false;
                var markersA = clusterA.getMarkers();
                var markersZ = clusterZ.getMarkers();

                if (clusterA.getSize() == 1 && clusterZ.getSize() == 1) {
                    var nodeA = <DM.Node> clusterA.getMarkers()[0].get('node');
                    var nodeZ = <DM.Node> clusterZ.getMarkers()[0].get('node');

                    if (nodeA.atypeEdgeNeighbours.indexOf(nodeZ) > -1) {
                        var line = new google.maps.Polyline({
                            path: [clusterA.getCenter(), clusterZ.getCenter()],
                            strokeColor: '#804000',
                            strokeOpacity: 0.5,
                            strokeWeight: 1
                        });
                        line.set('caption', nodeA.name + '-' + nodeZ.name);
                        google.maps.event.addListener(line, 'click', GMapTest.onLineClick);
                        GMapTest.linkOverlays.push(line);
                        line.setMap(GMapTest.map);
                    }

                    if (nodeA.bTypeEdgeNeighbours.indexOf(nodeZ) > -1) {
                        var line = new google.maps.Polyline({
                            path: [clusterA.getCenter(), clusterZ.getCenter()],
                            strokeColor: '#0000FF',
                            strokeOpacity: 0.5,
                            strokeWeight: 1
                        });
                        google.maps.event.addListener(line, 'click', GMapTest.onLineClick);
                        line.set('caption', nodeA.name + '-' + nodeZ.name);
                        GMapTest.linkOverlays.push(line);
                        line.setMap(GMapTest.map);
                    }

                    continue;
                }

                var linkDensity: number = 0;

                for (var mA = 0; mA < markersA.length; mA++) {
                    if (linkDensity > 0) {
                        break;
                    }
                    for (var mZ = 0; mZ < markersZ.length; mZ++) {
                        var nodeA = <DM.Node>markersA[mA].get('node');
                        var nodeZ = <DM.Node>markersZ[mZ].get('node');

                        if (nodeA.atypeEdgeNeighbours.indexOf(nodeZ) != -1 ||
                            nodeA.bTypeEdgeNeighbours.indexOf(nodeZ) != -1) {
                            linkDensity = 1;
                            break;
                        }
                    }
                }
                if (!linkDensity) {
                    continue;
                }
                var line = new google.maps.Polyline({
                    path: [clusterA.getCenter(), clusterZ.getCenter()],
                    strokeColor: '#000000',
                    strokeOpacity: 0.5,
                    strokeWeight: 1
                });
                line.set('caption', nodeA.name + '-' + nodeZ.name);
                google.maps.event.addListener(line, 'click', GMapTest.onLineClick);
                GMapTest.linkOverlays.push(line);
                line.setMap(GMapTest.map);
            }
        }
    }

    private static onLineClick(e: google.maps.PolyMouseEvent) {
        //log.debug('Edge \'' + this.get('caption') + '\' clicked');
        //alert('Edge \'' + this.get('caption') + '\' clicked') 
    }
}