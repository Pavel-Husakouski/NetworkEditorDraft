/// <reference path="../typings/Ext.d.ts" />

import ne = require('Scripts/NE/NetworkEditor');
import test = require('Scripts/Test');
import dm = require('Scripts/DM/DataModel');
import busModule = require("Scripts/Common/Bus");

var nodesSource;
var nodesPage;
var networkEditor: ne.NetworkEditor;
var bus: busModule.Bus;

function Init() { // warning ! init is started after cfg module was loaded
    Ext.tip.QuickTipManager.init();

    bus = new busModule.Bus();
    nodesSource = createNodeStore();
    nodesPage = createNodesPage(nodesSource);
    networkEditor = createNetworkEditor();

    test.init(networkEditor.map);
    //bus.subscribe('selection', function (a, sender) {

    //    root.UI.NE.model.selection.select(a, true);
    //    root.UI.TV.model.selection.select(a, true);
    //});

    bus.subscribe('added', function (a, sender) {

        if (a.dmObject instanceof dm.Node)
            nodesSource.add(a.dmObject);
        //atypeEdgeGridView.AddObject(a.dmObject, a.dmKey);
        //bTypeEdgeGridView.AddObject(a.dmObject, a.dmKey);
    });


    //root.UI.NE.model.selection.changedHandler = function (a, sender) {
    //    bus.publish('selection', a.map(function (x) { return x.dmObject}), sender);
    //};

    networkEditor.model.addedHandler = function (a, sender) {
        bus.publish('added', a, sender);
    }

    createMainFrame();
}

function createMainFrame()
{
    new Ext.Viewport({
        id: 'main',
        layout: 'border',
        items: <any[]>[
            cfg.ext.menubar(),
            cfg.ext.toolbar(),
            cfg.ext.tableViewPanel(),
            cfg.ext.propertyViewPanel(),
            cfg.ext.navigationViewPanel(),
            cfg.ext.networkEditorPanel()
        ]
    }) 
}

function createNetworkEditor() 
{
    var networkEditor = new ne.NetworkEditor(document.getElementById('canvasNetworkEditor'), cfg.ne.style());

    networkEditor.trackers['bTypeEdge'] = networkEditor.newEdgeTracker('bTypeEdge', (sa, sz) => new dm.BTypeEdge(sa, sz) )();
    networkEditor.trackers['atypeEdge'] = networkEditor.newEdgeTracker('atypeEdge', (sa, sz) => new dm.ATypeEdge(sa, sz) )();
    networkEditor.trackers['node'] = networkEditor.newVertexTracker('node', (position)  => new dm.Node(position, "Node" + nodesSource.count()))();

    return networkEditor;
}

function uploadNodes() {
    var box = cfg.ext.uploadBox('Upload Nodes', 'Home/UploadNodes', (data) => test.ShowOnMap(data.result.Data, 'node'));

    box.show();
};

function uploadBTypes() {
    var box = cfg.ext.uploadBox('Upload B Type Edges', 'Home/UploadBTypes', (data) => test.ShowOnMap(data.result.Data, 'bTypeEdge'));

    box.show();
};

function uploadAType() {
    var box = cfg.ext.uploadBox('Upload A Type Edges', 'Home/UploadAType', (data) => test.ShowOnMap(data.result.Data, 'atypeEdge'));

    box.show();
};

function createNodeStore() {
    var store = Ext.create('Ext.data.ArrayStore', {
        storeId: 'DataModel.Nodes',
        fields: [
        'name',
        'lat',
        'lng'
        ]
    });

    return store;
}



function createNodesPage(source) {
    var grid = Ext.create('Ext.grid.Panel', {
        store: source,
        height: 150,
        columns: [
            { text: "Name", width: 120, dataIndex: 'name', sortable: true },
            { text: "Lat", width: 120, dataIndex: 'lat', sortable: true },
            { text: "Lng", width: 120, dataIndex: 'lng', sortable: true }
        ],
        forceFit: true
    });
    return grid;
};


export module cfg {
    export module ne {
        function vertexStyle(icon) {
            var image = new google.maps.MarkerImage(icon);
            image.anchor = new google.maps.Point(8, 8);

            return { icon: image, cursor: 'default', draggable: false };
        }

        export function style(): any {

            return {
                'draggedvertex': function () {
                    return vertexStyle("Images/DraggedNodeTool.gif")
                },
                'bTypeEdge': function (n) {
                    return {
                        'regular': { strokeColor: 'blue' },
                        'selected': { strokeColor: 'orange' }
                    }[n]
                },
                'atypeEdge': function (n) {
                    return {
                        'regular': { strokeColor: 'brown' },
                        'selected': { strokeColor: 'orange' }
                    }[n]
                },
                'node': function (n) {
                    return {
                        'regular': vertexStyle("Images/NodeTool.gif"),
                        'selected': vertexStyle("Images/SelectedNodeTool.gif")
                    }[n]
                }
            }
        };

    }

    export module ext {
        export function uploadBox(title, url: string, success: (data) => any) {
            var box;

            box = Ext.create('Ext.form.Panel', {
                width: 500,
                height: 150,
                maximizable: false,
                modal: true,
                renderTo: 'Upload',
                title: title,
                buttons:
                    [
                        {
                            text: 'Ok',
                            handler: function () {
                                var form = this.up('form').getForm();
                                if (form.isValid()) {
                                    form.submit({
                                        url: url,
                                        success: success
                                    });
                                }
                                ;
                                box.hide();
                            },
                        },
                        {
                            text: 'Close',
                            handler: function () {
                                box.hide();
                            }
                        }
                    ],
                items: [{
                    xtype: 'form',
                    bodyStyle: 'padding: 10px;',
                    items: [{
                        itemId: 'file',
                        anchor: '0',
                        fieldLabel: 'Enter the path to the file',
                        labelAlign: 'top',
                        msgTarget: 'under',
                        xtype: 'filefield'
                    }]
                }]
            });

            return box;
        }

        export function menubar() {
            return {
                region: 'north',
                xtype: 'toolbar',
                height: 32,
                margins: '0 0 0 0',
                items: [
                    {
                        text: 'File',
                        menu: [
                            { text: 'New', handler: function () { alert('') } },
                            { text: 'Upload Nodes', handler: uploadNodes },
                            { text: 'Upload A Type', handler: uploadAType },
                            { text: 'Upload BTypes', handler: uploadBTypes }
                        ]
                    },
                    {
                        text: 'Edit',
                        menu: [
                            { text: 'Create', handler: function () { alert('Create') } },
                            { text: 'Clear', handler: function () { alert('Clear') } },
                            { text: 'Restore', handler: function () { alert('Restore') } },
                            { text: 'Delete', handler: function () { alert('Delete') } }
                        ]
                    },
                    {
                        text: 'View',
                        menu: [
                            { text: 'Properties', handler: function () { alert('Properties') } },
                            { text: 'Network Tree', handler: function () { alert('Object Pane View') } },
                            { text: 'Table View', handler: function () { alert('Table View') } }
                        ]
                    }
                ]
            };
        }

        export function navigationViewPanel() {
            return {
                region: 'west',
                stateId: 'navigation-panel',
                id: 'networkobjectspanel',
                title: 'Network Objects',
                split: true,
                collapsible: true,
                animCollapse: true,
                width: 200,
                minWidth: 175,
                maxWidth: 400,
                margins: '0 0 0 0',
                layout: 'accordion',
                items: [
                    {
                        contentEl: 'nodes',
                        title: 'Nodes',
                        iconCls: 'nav'
                    },
                    {
                        contentEl: 'bTypeEdges',
                        title: 'B Type Edges',
                        iconCls: 'nav'
                    },
                    {
                        contentEl: 'atypeEdges',
                        title: 'A Type Edges',
                        iconCls: 'nav'
                    }]
            };
        }

        export function networkEditorPanel() {
            return {
                region: 'center',
                layout: 'border',
                xtype: 'panel',
                contentEl: 'networkeditor',
                listeners: {
                    resize: function () {
                        var box = this.getBox();
                        var canvas = document.getElementById('canvasNetworkEditor');

                        networkEditor.resize(box.width, box.height);
                    }
                }
            };
        }

        export function propertyViewPanel() {
            return {
                xtype: 'tabpanel',
                region: 'east',
                id: 'propertiespanel',
                title: 'Properties',
                animCollapse: true,
                collapsible: true,
                split: true,
                width: 225, // give east and west regions a width
                minSize: 175,
                maxSize: 400,
                margins: '0 0 0 0',
                activeTab: 0,
                tabPosition: 'top',
                items: [
                    {
                        title: 'Property Grid',
                        contentEl: 'propertyEditor',
                        autoScroll: true
                    },
                    {
                        contentEl: 'Messages',
                        title: 'Messages',
                        autoScroll: true
                    }
                ]
            };
        }

        export function tableViewPanel() {
            return {
                region: 'south',
                id: 'tableviewpanel',
                split: true,
                height: 200,
                minSize: 100,
                maxSize: 200,
                collapsible: true,
                collapsed: false,
                title: 'Table View',
                margins: '0 0 0 0',
                items:
                    [
                        {
                            xtype: 'tabpanel',
                            id: 'tableviewtab',
                            animCollapse: false,
                            margins: '0 0 0 0',
                            activeTab: 0,
                            tabPosition: 'top',
                            items: <any[]>[
                                {
                                    xtype: 'panel',
                                    title: 'Nodes',
                                    lbar: [{
                                        iconCls: 'nav',
                                        tooltip: 'Refresh Nodes',
                                        id: 'refreshnodes',
                                        handler: function () { alert('Refresh Nodes') }
                                    }],

                                    items: [
                                        //Ext.create('Ext.grid.Panel', {
                                            //    store: nodesStore,
                                            //    height: 150,
                                            //    columns: [
                                            //        { text: "Name", width: 120, dataIndex: 'name1', sortable: true },
                                            //        { text: "Position", width: 120, dataIndex: 'position1', sortable: true }
                                            //        //{ text: "Y", width: 120, dataIndex: 'Y', sortable: true }
                                            //    ],
                                            //    forceFit: true
                                            //})
                                        nodesPage
                                    ]
                                },
                                {
                                    title: 'A Type',
                                    autoScroll: true
                                }
                            ]
                        }
                    ]
            };
        };

        export function toolbar() {
            return {
                region: 'north',
                xtype: 'toolbar',
                margins: '0 0 5 0',
                height: 32,
                items: [
                    {
                        xtype: 'button',
                        icon: "Images/Pointer.gif",
                        handler: function () { networkEditor.setMode('pointer') }
                    },
                    {
                        xtype: 'button',
                        icon: "Images/Pan.png",
                        handler: function () { networkEditor.setMode('pan') }
                    },
                    {
                        xtype: 'button',
                        icon: "Images/NodeTool.gif",
                        handler: function () { networkEditor.setMode('node') }
                    },
                    {
                        xtype: 'button',
                        icon: "Images/atypeEdgeTool.png",
                        handler: function () { networkEditor.setMode('atypeEdge') }
                    },
                    {
                        xtype: 'button',
                        icon: "Images/BTypeTool.png",
                        handler: function () { networkEditor.setMode('bTypeEdge') }
                    }
                ]
            };
        }
    }
}

Init();
