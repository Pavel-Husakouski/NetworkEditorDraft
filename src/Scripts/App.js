/// <reference path="../typings/Ext.d.ts" />
define(["require", "exports", 'Scripts/NE/NetworkEditor', 'Scripts/Test', 'Scripts/DM/DataModel', "Scripts/Common/Bus"], function(require, exports, ne, test, dm, busModule) {
    var nodesSource;
    var nodesPage;
    var networkEditor;
    var bus;

    function Init() {
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
        };

        createMainFrame();
    }

    function createMainFrame() {
        new Ext.Viewport({
            id: 'main',
            layout: 'border',
            items: [
                cfg.ext.menubar(),
                cfg.ext.toolbar(),
                cfg.ext.tableViewPanel(),
                cfg.ext.propertyViewPanel(),
                cfg.ext.navigationViewPanel(),
                cfg.ext.networkEditorPanel()
            ]
        });
    }

    function createNetworkEditor() {
        var networkEditor = new ne.NetworkEditor(document.getElementById('canvasNetworkEditor'), cfg.ne.style());

        networkEditor.trackers['bTypeEdge'] = networkEditor.newEdgeTracker('bTypeEdge', function (sa, sz) {
            return new dm.BTypeEdge(sa, sz);
        })();
        networkEditor.trackers['atypeEdge'] = networkEditor.newEdgeTracker('atypeEdge', function (sa, sz) {
            return new dm.ATypeEdge(sa, sz);
        })();
        networkEditor.trackers['node'] = networkEditor.newVertexTracker('node', function (position) {
            return new dm.Node(position, "Node" + nodesSource.count());
        })();

        return networkEditor;
    }

    function uploadNodes() {
        var box = cfg.ext.uploadBox('Upload Nodes', 'Home/UploadNodes', function (data) {
            return test.ShowOnMap(data.result.Data, 'node');
        });

        box.show();
    }
    ;

    function uploadBTypes() {
        var box = cfg.ext.uploadBox('Upload B Type Edges', 'Home/UploadBTypes', function (data) {
            return test.ShowOnMap(data.result.Data, 'bTypeEdge');
        });

        box.show();
    }
    ;

    function uploadAType() {
        var box = cfg.ext.uploadBox('Upload A Type Edges', 'Home/UploadAType', function (data) {
            return test.ShowOnMap(data.result.Data, 'atypeEdge');
        });

        box.show();
    }
    ;

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
    }
    ;

    (function (cfg) {
        (function (ne) {
            function vertexStyle(icon) {
                var image = new google.maps.MarkerImage(icon);
                image.anchor = new google.maps.Point(8, 8);

                return { icon: image, cursor: 'default', draggable: false };
            }

            function style() {
                return {
                    'draggedvertex': function () {
                        return vertexStyle("Images/DraggedNodeTool.gif");
                    },
                    'bTypeEdge': function (n) {
                        return {
                            'regular': { strokeColor: 'blue' },
                            'selected': { strokeColor: 'orange' }
                        }[n];
                    },
                    'atypeEdge': function (n) {
                        return {
                            'regular': { strokeColor: 'brown' },
                            'selected': { strokeColor: 'orange' }
                        }[n];
                    },
                    'node': function (n) {
                        return {
                            'regular': vertexStyle("Images/NodeTool.gif"),
                            'selected': vertexStyle("Images/SelectedNodeTool.gif")
                        }[n];
                    }
                };
            }
            ne.style = style;
            ;
        })(cfg.ne || (cfg.ne = {}));
        var ne = cfg.ne;

        (function (ext) {
            function uploadBox(title, url, success) {
                var box;

                box = Ext.create('Ext.form.Panel', {
                    width: 500,
                    height: 150,
                    maximizable: false,
                    modal: true,
                    renderTo: 'Upload',
                    title: title,
                    buttons: [
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
                            }
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
            ext.uploadBox = uploadBox;

            function menubar() {
                return {
                    region: 'north',
                    xtype: 'toolbar',
                    height: 32,
                    margins: '0 0 0 0',
                    items: [
                        {
                            text: 'File',
                            menu: [
                                { text: 'New', handler: function () {
                                        alert('');
                                    } },
                                { text: 'Upload Nodes', handler: uploadNodes },
                                { text: 'Upload A Type', handler: uploadAType },
                                { text: 'Upload BTypes', handler: uploadBTypes }
                            ]
                        },
                        {
                            text: 'Edit',
                            menu: [
                                { text: 'Create', handler: function () {
                                        alert('Create');
                                    } },
                                { text: 'Clear', handler: function () {
                                        alert('Clear');
                                    } },
                                { text: 'Restore', handler: function () {
                                        alert('Restore');
                                    } },
                                { text: 'Delete', handler: function () {
                                        alert('Delete');
                                    } }
                            ]
                        },
                        {
                            text: 'View',
                            menu: [
                                { text: 'Properties', handler: function () {
                                        alert('Properties');
                                    } },
                                { text: 'Network Tree', handler: function () {
                                        alert('Object Pane View');
                                    } },
                                { text: 'Table View', handler: function () {
                                        alert('Table View');
                                    } }
                            ]
                        }
                    ]
                };
            }
            ext.menubar = menubar;

            function navigationViewPanel() {
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
            ext.navigationViewPanel = navigationViewPanel;

            function networkEditorPanel() {
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
            ext.networkEditorPanel = networkEditorPanel;

            function propertyViewPanel() {
                return {
                    xtype: 'tabpanel',
                    region: 'east',
                    id: 'propertiespanel',
                    title: 'Properties',
                    animCollapse: true,
                    collapsible: true,
                    split: true,
                    width: 225,
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
            ext.propertyViewPanel = propertyViewPanel;

            function tableViewPanel() {
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
                    items: [
                        {
                            xtype: 'tabpanel',
                            id: 'tableviewtab',
                            animCollapse: false,
                            margins: '0 0 0 0',
                            activeTab: 0,
                            tabPosition: 'top',
                            items: [
                                {
                                    xtype: 'panel',
                                    title: 'Nodes',
                                    lbar: [{
                                            iconCls: 'nav',
                                            tooltip: 'Refresh Nodes',
                                            id: 'refreshnodes',
                                            handler: function () {
                                                alert('Refresh Nodes');
                                            }
                                        }],
                                    items: [
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
            }
            ext.tableViewPanel = tableViewPanel;
            ;

            function toolbar() {
                return {
                    region: 'north',
                    xtype: 'toolbar',
                    margins: '0 0 5 0',
                    height: 32,
                    items: [
                        {
                            xtype: 'button',
                            icon: "Images/Pointer.gif",
                            handler: function () {
                                networkEditor.setMode('pointer');
                            }
                        },
                        {
                            xtype: 'button',
                            icon: "Images/Pan.png",
                            handler: function () {
                                networkEditor.setMode('pan');
                            }
                        },
                        {
                            xtype: 'button',
                            icon: "Images/NodeTool.gif",
                            handler: function () {
                                networkEditor.setMode('node');
                            }
                        },
                        {
                            xtype: 'button',
                            icon: "Images/atypeEdgeTool.png",
                            handler: function () {
                                networkEditor.setMode('atypeEdge');
                            }
                        },
                        {
                            xtype: 'button',
                            icon: "Images/BTypeTool.png",
                            handler: function () {
                                networkEditor.setMode('bTypeEdge');
                            }
                        }
                    ]
                };
            }
            ext.toolbar = toolbar;
        })(cfg.ext || (cfg.ext = {}));
        var ext = cfg.ext;
    })(exports.cfg || (exports.cfg = {}));
    var cfg = exports.cfg;

    Init();
});
//# sourceMappingURL=App.js.map
