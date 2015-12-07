define({
    root: ({
        _widgetLabel: "Batch Attribute Editor",
        widgetIntroSelectByArea: "Use one of the tools below to create a selected set of features to update.  If the row is <font class='maxRecordInIntro'>highlighted</font>, the maximum number of records has been exceeded.",
        widgetIntroSelectByFeature: "Use the tool below to select a feature from <font class='layerInIntro'>${0}</font> layer.  This feature will be used select and update all intersecting features.  If the row is <font class='maxRecordInIntro'>highlighted</font>, the maximum number of records has been exceeded.",
        widgetIntroSelectByFeatureQuery: "Use the tool below to select a feature from <font class='layerInIntro'>${0}</font> .  This features <font class='layerInIntro'>${1}</font> attribute will be used query the layers below and update the resulting features.  If the row is <font class='maxRecordInIntro'>highlighted</font>, the maximum number of records has been exceeded.",
        widgetIntroSelectByQuery: "Enter a value to create a selection set.  If the row is <font class='maxRecordInIntro'>highlighted</font>, the maximum number of records has been exceeded.",
        layerTable: {
            colLabel: "Layer Name",
            numSelected: "#",
            colSyncStatus: ""
        },
        noConfiguredLayers: "No editable layers configured",
        editorPopupTitle: "Batch Attribute Editor",
        editorPopupSaveBtn: "Save",
        editorPopupMultipleValues: "",
        clear: "Clear",
        featuresUpdated: "${0} / ${1} feature(s) updated",
        featuresSelected: "${0} feature(s) selected",
        featuresSkipped: "Bypassed",

        search: "Search",
        queryInput: "Enter value to query",
        drawBox: {
            point: "Point",
            line: "Line",
            polyline: "Polyline",
            freehandPolyline: "Freehand Polyline",
            extent: "Extent",
            polygon: "Polygon",
            freehandPolygon: "Freehand Polygon",
            clear: "Clear",
            addPointToolTip: "Click to select in this area",
            addShapeToolTip: "Draw a shape to select features",
            freehandToolTip: "Press and hold to draw a shape to select features",
            startToolTip: "Draw a shape to select features"
        },
        errors: {
            layerNotFound: "Layer ${0} with ID ${1} was not found in the map, the map may have changed since the widgets configuration",
            queryNullID: "The feature from ${0} returned an invalid ID"
        }
    })
});
