define({
  root : {
    settingsHeader : "Set the details for the GeoLookup Widget",
    settingsDesc : "Geo-enrich a list of locations from a CSV file against polygon layers on the map. Selected fields from polygon layers are appended to the locations.",
    layerTable : {
      colEnrich : "Enrich",
      colLabel : "Layer",
      colFieldSelector : "Fields"
    },
    fieldTable : {
      colAppend : "Append",
      colName : "Name",
      colAlias : "Alias",
      label : "Check the field you want to append. Select a field to change its alias, order it, and format it."
    },
    symbolArea : {
      symbolLabelWithin : 'Select the symbol for locations within:',
      symbolLabelOutside : 'Select the symbol for locations outside:'
    },
    advSettings : {
      latFieldsDesc : "Possible field names for Latitude field.",
      longFieldsDesc : "Possible field names for Longitude field.",
      intersectFieldDesc : "The name of the field created to store value if lookup intersected a layer.",
      intersectInDesc : "Value to store when location intersected a polygon.",
      intersectOutDesc : "Value to store when location did not intersected a polygon.",
      maxRowCount : "Maximum number of rows in CSV file.",
      cacheNumberDesc : "Point cluster threshold for faster processing.",
      subTitle : "Set values for CSV file."
    },
    noPolygonLayers : "No Polygon Layers",
    errorOnOk : "Please fill out all parameters before saving config",
    saveFields : "Save Fields",
    cancelFields : "Cancel Fields",
    saveAdv : "Save Adv. Settings",
    cancelAdv : "Cancel Adv. Settings",
    advSettingsBtn : "Advance Settings"
  }
});
