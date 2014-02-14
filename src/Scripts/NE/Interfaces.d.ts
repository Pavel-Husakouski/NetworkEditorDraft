/// <reference path="../../Typings/google.maps.d.ts" />

interface Array {
    remove(obj:any);
}

interface Point {
    x: number;
    y: number;
}

interface Rect {
    left: number;
    width: number;
    right: number;
    top: number;
    bottom: number;
    height: number;
}

interface Tracker {
    begin();
    end();
    processing();
}

interface IDmFactory {
    newNode(position: google.maps.LatLng): any;
    newatypeEdge(nodeA: any, nodeZ: any): any;
    newBType(nodeA: any, nodeZ: any): any;
}

interface IEditorObject extends IUniqueObject {
    dmObject: any;
    selected: boolean;
    getView():any;
}

interface IUniqueObject
{
    getId(): string;
}

interface IEdge extends IEditorObject {
    vertexA: IVertex;
    vertexZ: IVertex;
}

interface IVertex extends IEditorObject {
    connect(edge: IEdge);
}

interface ISelection {
    clear();
    getItems(): IEditorObject[];
    select(target: IEditorObject[]);
    toggle(target: IEditorObject);
}

interface IModel {
    selection: ISelection;
    selectWithinBounds(bounds:google.maps.LatLngBounds, combine?:boolean);

    addedHandler(obj: IEditorObject, sender: any): void;
    createEdge(va: IVertex, vz: IVertex, style: (n: string) => google.maps.PolylineOptions, dmObject: any): IEdge;
    createVertex(pos: google.maps.LatLng, style: (n: string) => google.maps.MarkerOptions, dmObject: any): IVertex;
}

declare enum Styles
{
    regular,
    selected 
}