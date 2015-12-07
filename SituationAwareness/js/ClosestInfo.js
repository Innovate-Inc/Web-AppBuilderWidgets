define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/Color',
  'dojo/_base/array',
  'dojo/DeferredList',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/on',
  'esri/geometry/geometryEngine',
  'esri/geometry/Polyline',
  'esri/graphic',
  'esri/layers/FeatureLayer',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/Font',
  'esri/symbols/TextSymbol',
  'esri/tasks/query'
], function(
  declare,
  lang,
  Color,
  array,
  DeferredList,
  domClass,
  domConstruct,
  domStyle,
  on,
  geometryEngine,
  Polyline,
  Graphic,
  FeatureLayer,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  Font,
  TextSymbol,
  Query
) {

  var closestInfo = declare('ClosestInfo', null, {

    constructor: function(tab, container, parent) {
      this.tab = tab;
      this.container = container;
      this.parent = parent;
      this.incident = null;
      this.graphicsLayer = null;
      this.map = parent.map;
      this.domainMap = {};
      this.dateFields = [];
      this.dateFields = {};
    },

    updateForIncident: function(incident, distance, graphicsLayer) {
      array.forEach(this.tab.tabLayers, lang.hitch(this, function(tab) {
        if(typeof(tab.empty) !== 'undefined') {
          var tempFL = new FeatureLayer(tab.url);
          on(tempFL, "load", lang.hitch(this, function() {
            this.tab.tabLayers = [tempFL];
            this.processIncident(incident, distance, graphicsLayer);
          }));
        } else {
          this.processIncident(incident, distance, graphicsLayer);
        }
      }));
    },

    // update for incident
    // for polygon: call it twice: first time: within the polygon, second time: within the buffer
    processIncident: function(incident, distance, graphicsLayer) {
      this.container.innerHTML = "Loading...";
      var results = [];
      this.incident = incident;
      var unit = this.parent.config.distanceUnits;
      var unitCode = this.parent.config.distanceSettings[unit];
      var bufferGeom = geometryEngine.buffer(incident.geometry, distance, unitCode);
      this.graphicsLayer = graphicsLayer;
      this.graphicsLayer.clear();

      var tabLayers = this.tab.tabLayers;
      var defArray = [];
      for (var i = 0; i < tabLayers.length; i++) {
        var layer = tabLayers[i];
        var query = new Query();
        query.returnGeometry = true;
        query.geometry = bufferGeom;
        query.outFields = this._getFields(layer);
        defArray.push(layer.queryFeatures(query));
      }
      var defList = new DeferredList(defArray);
      defList.then(lang.hitch(this, function(defResults) {
        for (var r = 0; r < defResults.length; r++) {
          var featureSet = defResults[r][1];
          var layer = tabLayers[r];
          var fields = this._getFields(layer);
          var graphics = featureSet.features;
          if (graphics.length > 0) {
            for (var g = 0; g < graphics.length; g++) {
              var gra = graphics[g];
              var geom = gra.geometry;
              var dist = this._getDistance(incident.geometry, geom);
              var newAttr = {
                DISTANCE: dist
              };
              for (var f = 0; f < fields.length; f++) {
                newAttr[fields[f]] = gra.attributes[fields[f]];
              }
              gra.attributes = newAttr;
            }
            graphics.sort(this._compareDistance);
            results.push(graphics[0]);
          }
        }
        this._processResults(results);
      }));
    },

    // process results
    _processResults: function(results) {
      this.container.innerHTML = "";

      if (results.length === 0) {
        this.container.innerHTML = this.parent.nls.noFeaturesFound;
      }

      var tpc = domConstruct.create("div", {
        id: "tpc",
        style: "width:" + (results.length * 220) + "px;"
      }, this.container);
      domClass.add(tpc, "IMT_tabPanelContent");

      var unit = this.parent.config.distanceUnits;
      var units = this.parent.nls[unit];
      var prevFormat = "";
      var dFormat = null;
      for (var i = 0; i < results.length; i++) {

        var num = i + 1;
        var gra = results[i];
        var geom = gra.geometry;
        var loc = geom;

        if (geom.type !== "point") {
          loc = geom.getExtent().getCenter();
        }
        var attr = gra.attributes;
        var dist = attr.DISTANCE;
        var distLbl = units + ": " + Math.round(dist * 100) / 100;

        var info = "";
        var c = 0;
        for (var prop in attr) {
            if (prop !== "DISTANCE" && c < 3) {
                var newVal = attr[prop];
              if (typeof(this.domainMap[prop]) !== 'undefined') {
                  var d = this.domainMap[prop];             
                  if (typeof (d.codedValues) !== 'undefined') {
                      for (var iii = 0; iii < d.codedValues.length; iii++) {
                          if (d.codedValues[iii].code === newVal) {
                              newVal = d.codedValues[iii].name;
                          }
                      }
                  }
                  info += newVal + "<br/>";
              } else {
                  if (prop in this.dateFields) {
                      if (this.dateFields[prop] !== prevFormat) {
                          prevFormat = this.dateFields[prop];
                          dFormat = this._getDateFormat(this.dateFields[prop]);
                      }
                      newVal = new Date(attr[prop]).toLocaleDateString('en-US', dFormat);
                  }
                  info += newVal + "<br/>";
              }
            c += 1;
          }
        }

        var div = domConstruct.create("div", {
          id: "Feature_" + num
        }, tpc);
        domClass.add(div, "IMTcolRec");

        var div1 = domConstruct.create("div", {}, div);
        domClass.add(div1, "IMTcolRecBar");

        var div2 = domConstruct.create("div", {
          innerHTML: num
        }, div1);
        domClass.add(div2, "IMTcolRecNum");
        domStyle.set(div2, "backgroundColor", this.parent.config.color);
        on(div2, "click", lang.hitch(this, this._zoomToLocation, loc));

        var div3 = domConstruct.create("div", {
          innerHTML: distLbl
        }, div1);
        domClass.add(div3, "IMTcolDistance");

        if (this.parent.config.enableRouting) {
          var div4 = domConstruct.create("div", {}, div1);
          domClass.add(div4, "IMTcolDir");
          on(div4, "click", lang.hitch(this, this._routeToIncident, loc));
        }

        var div5 = domConstruct.create("div", {
          innerHTML: info
        }, div);
        domClass.add(div5, "IMTcolInfo");

        var sls = new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID, new Color.fromString(this.parent.config.color), 1);
        var sms = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 24, sls, new Color.fromString(this.parent.config.color));
        var fnt = new Font();
        fnt.family = "Arial";
        fnt.size = "12px";
        var symText = new TextSymbol(num, fnt, "#ffffff");
        symText.setOffset(0, -4);

        if (attr.OUTSIDE_POLYGON === null) {
          var distSym = new SimpleLineSymbol(
            SimpleLineSymbol.STYLE_SOLID, new Color([0, 0, 0, 1]), 1);
          var distLine = new Polyline(loc.spatialReference);
          var distPt = this.incident.geometry;
          if (this.incident.geometry.type !== "point") {
            distPt = this.incident.geometry.getExtent().getCenter();
          }
          distLine.addPath([loc, distPt]);
          this.graphicsLayer.add(new Graphic(distLine, distSym, {}));
        }
        this.graphicsLayer.add(new Graphic(loc, sms, attr));
        this.graphicsLayer.add(new Graphic(loc, symText, attr));

      }

    },

    // getFields
    _getFields: function(layer) {
        var fields = [];
      if (layer.infoTemplate) {
          var fldInfos = layer.infoTemplate.info.fieldInfos;
      } else if (this.parent.map.itemInfo.itemData.operationalLayers.length > 0) {
          var mapLayers = this.parent.map.itemInfo.itemData.operationalLayers;
          var fldInfos = null;
          for (var i = 0; i < mapLayers.length; i++) {
              var lyr = mapLayers[i];
              if (lyr.layerType === "ArcGISMapServiceLayer") {
                  for (var ii = 0; ii < lyr.layers.length; ii++) {
                      var sl = lyr.layers[ii];
                      if (sl.popupInfo) {
                          if (sl.id === layer.layerId) {
                              fldInfos = sl.popupInfo.fieldInfos;
                          }
                      }
                  }
              }
          }
          if (!fldInfos) {
              fldInfos = layer.fields;
          }
      } else {
          var fldInfos = layer.fields;
      }
      var lyrFieldInfos = layer.fields;
      fieldInfoLoop:
      for (var i = 0; i < fldInfos.length; i++) {
          var fld = fldInfos[i];
          if (typeof (fld.visible) !== 'undefined' ? fld.visible : true) {
            layerFieldLoop:           
                  for (var j = 0; j < lyrFieldInfos.length; j++) {
                  var lyrFld = lyrFieldInfos[j];
                  if (typeof (fld.fieldName) !== 'undefined') {
                      if (fld.fieldName === lyrFld.name) {
                          break layerFieldLoop;
                      }
                  } else {
                      if (fld.name === lyrFld.name) {
                          break layerFieldLoop;
                      }
                  }
              }
              if (typeof (lyrFld.domain) !== 'undefined') {
                  this.domainMap[lyrFld.name] = lyrFld.domain;
              }
              if (lyrFld.type === "esriFieldTypeDate") {
                  if (layer.infoTemplate) {
                      for (var key in layer.infoTemplate._fieldsMap) {
                          if (typeof (layer.infoTemplate._fieldsMap[key].fieldName) !== 'undefined') {
                              if (layer.infoTemplate._fieldsMap[key].fieldName === lyrFld.name) {
                                  if (typeof (layer.infoTemplate._fieldsMap[key].format.dateFormat) !== 'undefined') {
                                      this.dateFields[lyrFld.name] = layer.infoTemplate._fieldsMap[key].format.dateFormat;
                                  }
                              }
                          }
                          else {
                              //TODO should a default be set??
                              //this.dateFields[lyrFld.name] = ;
                          }
                      }
                  }
              }
              fields.push(lyrFld.name);
          }
      }
      return fields;
    },

    // get distance
    _getDistance: function(geom1, geom2) {
      var dist = 0;
      var units = this.parent.config.distanceUnits;
      dist = geometryEngine.distance(geom1, geom2, 9001);
      switch (units) {
        case "miles":
          dist *= 0.000621371;
          break;
        case "kilometers":
          dist *= 0.001;
          break;
        case "feet":
          dist *= 3.28084;
          break;
        case "yards":
          dist *= 1.09361;
          break;
        case "nauticalMiles":
          dist *= 0.000539957;
          break;
      }
      return dist;
    },

    _getDateFormat: function (dFormat) {
        //default is Month Day Year
        var options = { month: '2-digit', day: '2-digit', year: 'numeric' };
        switch (dFormat) {
            case "shortDate":
                //12/21/1997
                options = {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                };
                break;
            case "shortDateLE":
                //21/12/1997
                options = {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                };
                break;
            case "longMonthDayYear":
                //December 21,1997
                options = {
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric'
                };
                break;
            case "dayShortMonthYear":
                //21 Dec 1997
                options = {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                };
                break;
            case "longDate":
                //Sunday, December 21, 1997
                options = {
                    weekday: 'long',
                    month: 'long',
                    day: '2-digit',
                    year: 'numeric'
                };
                break;
            case "shortDateLongTime":
                //12/21/1997 6:00:00 PM
                options = {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                };
                break;
            case "shortDateLELongTime":
                //21/12/1997 6:00:00 PM
                options = {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                };
                break;
            case "shortDateShortTime":
                //12/21/1997 6:00 PM
                options = {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                };
                break;
            case "shortDateLEShortTime":
                //21/12/1997 6:00 PM
                options = {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                };
                break;
            case "shortDateShortTime24":
                //12/21/1997 18:00
                options = {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: false
                };
                break;
            case "shortDateLEShortTime24":
                //21/12/1997 18:00
                options = {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: false
                };
                break;
            case "longMonthYear":
                //December 1997
                options = {
                    month: 'long',
                    year: 'numeric'
                };
                break;
            case "shortMonthYear":
                //Dec 1997
                options = {
                    month: 'short',
                    year: 'numeric'
                };
            case "year":
                //1997
                options = {
                    year: 'numeric'
                };
                break;
        }
        return options;
    },

    // COMPARE DISTANCE
    _compareDistance: function(a, b) {
      if (a.attributes.DISTANCE < b.attributes.DISTANCE) {
        return -1;
      }
      if (a.attributes.DISTANCE > b.attributes.DISTANCE) {
        return 1;
      }
      return 0;
    },

    // zoom to location
    _zoomToLocation: function(loc) {
      this.parent.zoomToLocation(loc);
    },

    // route to incident
    _routeToIncident: function(loc) {
      this.parent.routeToIncident(loc);
    }
  });

  return closestInfo;

});
