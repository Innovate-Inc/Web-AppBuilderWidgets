define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/Color',
  'dojo/dom',
  'dojo/dom-class',
  'dojo/dom-construct',
  'dojo/dom-style',
  'dojo/number',
  'dojo/on',
  'dojo/has',
  'dijit/form/Button',
  'jimu/dijit/Popup',
  'esri/config',
  'esri/geometry/mathUtils',
  'esri/geometry/Point',
  'esri/geometry/webMercatorUtils',
  'esri/graphic',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/Font',
  'esri/symbols/TextSymbol',
  'esri/tasks/query'
], function(
  declare,
  array,
  lang,
  Color,
  dom,
  domClass,
  domConstruct,
  domStyle,
  number,
  on,
  has,
  Button,
  Popup,
  esriConfig,
  mathUtils,
  Point,
  webMercatorUtils,
  Graphic,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  Font,
  TextSymbol,
  Query
) {

  var summaryInfo = declare('SummaryInfo', null, {

    summaryLayer: null,
    summaryFields: [],
    summaryIds: [],
    summaryFeatures: [],

    constructor: function(tab, container, parent) {
      this.tab = tab;
      this.container = container;
      this.parent = parent;
    },

    /* jshint unused: true */
    // update for incident
    updateForIncident: function(incident, buffer) {
      this.container.innerHTML = "Loading...";
      if (this.tab.tabLayers.length > 0) {
        this.summaryLayer = this.tab.tabLayers[0];
      }
      this.summaryFields = this._getFields(this.summaryLayer);
      this.summaryIds = [];
      this.summaryFeatures = [];
      this._queryFeatures(buffer.geometry);
    },

    // query features
    _queryFeatures: function(geom) {
      var query = new Query();
      query.geometry = geom;
      this.summaryLayer.queryIds(query, lang.hitch(this, function(objectIds) {
        this.summaryIds = objectIds;
        if (this.summaryIds.length > 0) {
          this._queryFeaturesByIds();
        } else {
          this._processResults();
        }
      }));
    },

    // query features by ids
    _queryFeaturesByIds: function() {
      var max = this.summaryLayer.maxRecordCount || 1000;
      var ids = this.summaryIds.slice(0, max);
      this.summaryIds.splice(0, max);
      var query = new Query();
      query.returnGeometry = false;
      var outFields = [];
      array.forEach(this.summaryFields, function(f) {
        outFields.push(f.field);
      });
      query.outFields = outFields;
      query.objectIds = ids;
      this.summaryLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
        var graphics = featureSet.features;
        for (var g = 0; g < graphics.length; g++) {
          var gra = graphics[g];
          var attr = gra.attributes;
          for (var f = 0; f < this.summaryFields.length; f++) {
            var obj = this.summaryFields[f];
            var fld = obj.field;
            var value = attr[fld];
            obj.total += value;
          }
        }
        this.summaryFeatures = this.summaryFeatures.concat(featureSet.features);
        this._processResults();
        if (this.summaryIds.length > 0) {
          this._queryFeaturesByIds();
        }
      }));
    },

    // process results
    _processResults: function() {
      this.container.innerHTML = "";
      var results = this.summaryFields;
      var numberOfDivs = results.length + 1;
      var tpc = domConstruct.create("div", {
        id: "tpc",
        style: "width:" + (numberOfDivs * 220) + "px;"
      }, this.container);
      domClass.add(tpc, "IMT_tabPanelContent");

      var div_results_extra = domConstruct.create("div", {}, tpc);
      domClass.add(div_results_extra, "IMTcol");

      var div_exp = domConstruct.create("div", {
        innerHTML: this.parent.nls.downloadCSV
      }, div_results_extra);
      domClass.add(div_exp, "btnExport");
      on(div_exp, "click", lang.hitch(this, this._exportToCSV));

      for (var i = 0; i < results.length; i++) {
        var obj = results[i];
        var info = obj.alias + "<br/>";
        var total = Math.round(obj.total);
        if (isNaN(total)) {
          total = 0;
        }
        info += "<div class='colSummary'>" + number.format(total) + "</div><br/>";
        var div = domConstruct.create("div", {
          id: "Demographics_" + i,
          innerHTML: info
        }, tpc);
        domClass.add(div, "IMTcol");
      }
    },

    _exportToCSV: function() {
      if (this.summaryFeatures.length === 0) {
        return false;
      }

      var s_csv = "";
      var attr;
      var prop;
      // build the header
      var results = this.summaryFeatures;
      attr = results[0].attributes;
      for (prop in attr) {
        s_csv += (s_csv.length === 0 ? "" : ",") + '"' + prop + '"';
      }
      s_csv += "\r\n";

      var s_line = "";
      for (var i = 0; i < results.length; i++) {
        s_line = "";
        var gra = results[i];
        attr = gra.attributes;
        for (prop in attr) {
          s_line += (s_line.length === 0 ? "" : ",") + '"' + attr[prop] + '"';
        }
        s_csv += s_line + "\r\n";
      }
      this._download(this.tab.tabLayers[0].id + ".csv", s_csv);
    },

    _download: function(filename, text) {
      if (has("ie")) {
        var oWin = window.open("about:blank", "_blank");
        oWin.document.write(text);
        oWin.document.close();
        oWin.document.execCommand('SaveAs', true, filename);
        oWin.close();
      } else {
        var link = domConstruct.create("a", {
          href: 'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
          download: filename
        });
        link.click();
        domConstruct.destroy(link);
      }
    },

    // getFields
    _getFields: function(layer) {
      var fields = [];
      var fldInfos = layer.infoTemplate.info.fieldInfos;
      for (var i = 0; i < fldInfos.length; i++) {
        var fld = fldInfos[i];
        var fldType = layer.fields[i].type;
        if (fld.visible && fld.fieldName !== layer.objectIdField &&
          (fldType === "esriFieldTypeDouble" || fldType === "esriFieldTypeInteger")) {
          var obj = {
            field: fld.fieldName,
            alias: fld.label,
            total: 0
          };
          fields.push(obj);
        }
      }
      return fields;
    }

  });

  return summaryInfo;

});
