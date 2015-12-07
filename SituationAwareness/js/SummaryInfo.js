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
  'esri/layers/FeatureLayer',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/symbols/Font',
  'esri/symbols/TextSymbol',
  'esri/tasks/query',
  './../js/AdvanceStats',
  'esri/renderers/jsonUtils'
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
  FeatureLayer,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  Font,
  TextSymbol,
  Query,
  AdvanceStats,
  jsonUtil
) {

    var summaryInfo = declare('SummaryInfo', null, {

        summaryLayer: null,
        summaryFields: [],
        summaryIds: [],
        summaryFeatures: [],
        symbolField: null,
        //jh
        graphicsLayer: null,
        lyrRenderer: null,
        lyrSymbol: null,
        constructor: function(tab, container, parent) {
            this.tab = tab;
            this.container = container;
            this.parent = parent;
            this.graphicsLayer = null;
        },

        /* jshint unused: true */
        // update for incident
        updateForIncident: function(incident, buffer, graphicsLayer) {
            this.container.innerHTML = "Loading...";
            this.summaryIds = [];
            this.summaryFeatures = [];
            if (this.tab.tabLayers.length > 0) {
                if(typeof(this.tab.tabLayers[0].infoTemplate) !== 'undefined') {
                    this.summaryLayer = this.tab.tabLayers[0];
                    this.summaryFields = this._getFields(this.summaryLayer);
                    this._updateRenderer(graphicsLayer);
                    lang.hitch(this, this._queryFeatures(buffer.geometry));
                } else {
                    var tempFL = new FeatureLayer(this.tab.tabLayers[0].url);
                    on(tempFL, "load", lang.hitch(this, function() {
                        this.summaryLayer = tempFL;
                        this.summaryFields = this._getFields(this.summaryLayer);
                        this._updateRenderer(graphicsLayer);
                        lang.hitch(this, this._queryFeatures(buffer.geometry));
                    }));
                }
            }
        },

        _updateRenderer: function (gl) {
            if (gl !== null) {
                this.graphicsLayer = gl;
                this.graphicsLayer.clear();
                if (!this.lyrRenderer) {
                    if (this.summaryLayer) {
                        if (this.summaryLayer.renderer.attributeField) {
                            this.lyrRenderer = this.summaryLayer.renderer;
                            this.graphicsLayer.renderer = this.lyrRenderer;
                        }
                        else {
                            this.lyrRenderer = this.summaryLayer.renderer;
                            this.graphicsLayer.renderer = this.lyrRenderer;
                            this.lyrSymbol = this.lyrRenderer.symbol;
                        }
                    }
                }else {
                    this.graphicsLayer.renderer = this.lyrRenderer;
                }
            }
        },

        // query features
        //Solutions: added a check to see if advanced stats existed.  Calls AdvanceStats to do statistic definitions then comes back.
        //Also, once back, it does query by ids.  this is needed for the download function.
        //If it does not have advanced stats, then do existing query by ids.
        _queryFeatures: function(geom) {
            if(this.tab.advStat) {
                var advStat = new AdvanceStats(this.tab, this.summaryLayer, geom, this.parent);
                on(advStat, 'complete', lang.hitch(this, function(results) {
                    this.summaryFields = [];
                    array.forEach(results, lang.hitch(this, function(result) {
                        this.summaryFields.push(result);
                    }));
                    this._processResults();
                    var query = new Query();
                    query.geometry = geom;
                    this.summaryLayer.queryIds(query, lang.hitch(this, function(objectIds) {
                        if(objectIds) {
                            this.summaryIds = objectIds;
                            if (this.summaryIds.length > 0) {
                                if(dom.byId('IMT_download')) {
                                    domClass.replace(dom.byId('IMT_download'), "processing", "download");
                                }
                                this._queryFeaturesByIds('export');
                            }
                        }
                    }));
                }));

            } else {
                var query = new Query();
                query.geometry = geom;
                this.summaryLayer.queryIds(query, lang.hitch(this, function(objectIds) {
                    if(objectIds) {
                        this.summaryIds = objectIds;
                        if (this.summaryIds.length > 0) {
                            this._queryFeaturesByIds('summary');
                        } else {
                            this._processResults();
                        }
                    } else {
                        this._processResults();
                    }
                }));
            }
        },

        // query features by ids
        //Solutions: Add the pAction arg to flag if the call is to just to export records.  No doing math.
        _queryFeaturesByIds: function(pAction) {
            var max = this.summaryLayer.maxRecordCount || 1000;
            var ids = this.summaryIds.slice(0, max);
            this.summaryIds.splice(0, max);
            var query = new Query();
            //jh added to check if we are displaying features...if so we need the geom
            query.returnGeometry = (this.graphicsLayer) ? true : false;

            var outFields = [];
            array.forEach(this.summaryFields, function(f) {
                outFields.push(f.field);
            });

            //jh if rendering is based on attribute values we need the field
            if (this.symbolField) {
                outFields.push(this.symbolField.field);
            }
            if(pAction !== 'export') {
                query.outFields = outFields;
            } else {
                query.outFields = ['*'];
            }
            query.objectIds = ids;
            this.summaryLayer.queryFeatures(query, lang.hitch(this, function(featureSet) {
                if(pAction !== 'export') {
                    var graphics = featureSet.features;
                    for (var g = 0; g < graphics.length; g++) {
                        var gra = graphics[g];
                        var attr = gra.attributes;
                        for (var f = 0; f < this.summaryFields.length; f++) {
                            var skipField = this.symbolField ? this.summaryFields[f] === this.symbolField : false;
                            if (!skipField) {
                                var obj = this.summaryFields[f];
                                var fld = obj.field;
                                var value = attr[fld];
                                obj.total += value;
                            }
                        }
                        //jh
                        if (this.graphicsLayer !== null) {
                            if (this.lyrSymbol) {
                                gra.symbol = this.lyrSymbol;
                            }
                            else {
                                var sym = this.graphicsLayer.renderer.getSymbol(gra);
                                gra.symbol = sym;
                            }
                            this.graphicsLayer.add(new Graphic(gra.geometry, gra.symbol, gra.attributes, gra.infoTemplate));
                        }
                    }
                    this.summaryFeatures = this.summaryFeatures.concat(featureSet.features);
                    this._processResults();
                }
                else {
                    this.summaryFeatures = this.summaryFeatures.concat(featureSet.features);
                    var graphics = featureSet.features;
                    for (var g = 0; g < graphics.length; g++) {
                        var gra = graphics[g];
                        var attr = gra.attributes;
                        for (var f = 0; f < this.summaryFields.length; f++) {
                            var skipField = this.symbolField ? this.summaryFields[f] === this.symbolField : false;
                            if (!skipField) {
                                var obj = this.summaryFields[f];
                                var fld = obj.field;
                                var value = attr[fld];
                                obj.total += value;
                            }
                        }
                        //jh
                        if (this.graphicsLayer !== null) {
                            if (this.lyrSymbol) {
                                gra.symbol = this.lyrSymbol;
                            }
                            else {
                                var sym = this.graphicsLayer.renderer.getSymbol(gra);
                                gra.symbol = sym;
                            }
                            this.graphicsLayer.add(new Graphic(gra.geometry, gra.symbol, gra.attributes, gra.infoTemplate));
                        }
                    }
                    if (this.graphicsLayer !== null){
                        if (this.lyrRenderer !== null || this.lyrSymbol !== null) {
                            this._storeGraphics(this.summaryLayer.url, this.lyrRenderer);
                        }
                    }
                }
                if (this.summaryIds.length > 0) {
                    this._queryFeaturesByIds(pAction);
                } else {
                    if(dom.byId('IMT_download')) {
                        domClass.replace(dom.byId('IMT_download'), "download", "processing");
                    }
                }
            }));
        },

        // process results
        //Solutions: added a string search looking for area or length to not round up.
        _processResults: function() {
            this.container.innerHTML = "";
            var results = this.summaryFields;

            //jh I don't think this is necessary anymore 
            if (this.symbolField) {
                var idx = results.indexOf(this.symbolField);
                if(idx > 0){
                    results.splice(idx, 1)
                }
            }
            var numberOfDivs = results.length + 1;
            var total = 0;
            var tpc = domConstruct.create("div", {
                id: "tpc",
                style: "width:" + (numberOfDivs * 220) + "px;"
            }, this.container);
            domClass.add(tpc, "IMT_tabPanelContent");

            var div_results_extra = domConstruct.create("div", {}, tpc);
            domClass.add(div_results_extra, "IMTcol");

            var div_exp = domConstruct.create("div", {
                id: 'IMT_download',
                innerHTML: this.parent.nls.downloadCSV
            }, div_results_extra);
            domClass.add(div_exp, ['btnExport', 'download']);
            on(div_exp, "click", lang.hitch(this, this._exportToCSV2));

            for (var i = 0; i < results.length; i++) {
                var obj = results[i];
                var info = obj.alias + "<br/>";
                if(info.indexOf(">area<") !== -1 || info.indexOf(">length<") !== -1) {
                    total = obj.total;
                } else {
                    total = Math.round(obj.total);
                }
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

            if (this.graphicsLayer !== null) {
                if (this.lyrRenderer !== null || this.lyrSymbol !== null) {
                    this._storeGraphics(this.summaryLayer.url, this.lyrRenderer);
                }
            }
        },

        //JH
        _storeGraphics: function (url, lyrSym) {

            var jgs = [];
            array.forEach(this.graphicsLayer.graphics, function (graphic) {
                var g = graphic.toJson();
                jgs.push(g);
            });

            var obj_to_store = null;
            if (this.lyrSymbol) {
                obj_to_store = {
                    "graphics": JSON.stringify(jgs),
                    "symbol": this.lyrSymbol.toJson()
                };
            } else {
                obj_to_store = {
                    "graphics": JSON.stringify(jgs),
                    "renderer": lyrSym.toJson()
                };
            }


            //obj_to_store = {
            //    "graphics": JSON.stringify(jgs)
            //};

            var s_obj = JSON.stringify(obj_to_store);

            window.localStorage.setItem(url, s_obj);
            console.log("Graphics saved to storage");
        },

        //JH
        _restoreGraphics: function (url, gl) {
            var stored_graphics = window.localStorage.getItem(url);
            if (stored_graphics !== null && stored_graphics !== "null") {

                var obj = JSON.parse(stored_graphics, true);

                var graphics = obj.graphics;
                if (graphics) {
                    this.graphicsLayer = gl;
                    this.graphicsLayer.clear();
                    var ga = JSON.parse(graphics);

                    if (obj.symbol) {
                        //TODO I think I would need a new instance of a
                        // renderer here and then could set the symbol??
                        this.graphicsLayer.renderer.symbol = jsonUtil.fromJson(obj.symbol);
                    } else if (obj.renderer) {
                        this.graphicsLayer.renderer = jsonUtil.fromJson(obj.renderer);
                    }
                    else {
                        //TODO should I set some default symbols in case something doesn't work??
                        alert("Symbols didn't come through for some reason");
                    }


                    array.forEach(ga, lang.hitch(this, function (graphic) {
                        this.graphicsLayer.add(new Graphic(graphic));
                    }));
                }
                return true;
            }
            else {
                return false;
            }
        },

        //Solutions: Used a different content string for download.  Let main developer determine which to use.
        _exportToCSV2: function() {
            if (this.summaryFeatures.length === 0) {
                return false;
            }

            var csvContent = "";
            var firstRec = this.summaryFeatures[0];
            var arrayHeader = [];
            for(var key in firstRec.attributes) {
                if (firstRec.attributes.hasOwnProperty(key)) {
                    arrayHeader.push(key);
                }
            }
            csvContent += arrayHeader.join(",") + "\r\n";

            array.forEach(this.summaryFeatures, function(rec){
                var tempArray = [];
                for(var key in rec.attributes) {
                    if (rec.attributes.hasOwnProperty(key)) {
                        tempArray.push(rec.attributes[key]);
                    }
                }
                csvContent += tempArray.join(",") + "\r\n";
            });

            if(typeof(this.tab.tabLayers[0].id) !== 'undefined') {
                this._download(this.tab.tabLayers[0].id + ".csv", csvContent);
            } else {
                this._download(this.tab.layers + ".csv", csvContent);
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

        _isIE11: function () {
            var iev = 0;
            var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
            var trident = !!navigator.userAgent.match(/Trident\/7.0/);
            var rv = navigator.userAgent.indexOf("rv:11.0");
            if (ieold) {
                iev = Number(RegExp.$1);
            }
            if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
                iev = 10;
            }
            if (trident && rv !== -1) {
                iev = 11;
            }
            return iev === 11;
        },

        //Solutions: changed from encodeURIComponet to encodeURI.  Able to download from 8K to 13K+ in tests
        _download: function(filename, text) {
            if (has("ie") || this._isIE11()) {
                var oWin = window.open("about:blank", "_blank");
                oWin.document.write(text);
                oWin.document.close();
                oWin.document.execCommand('SaveAs', true, filename);
                oWin.close();
            } else if (has("mozilla")) {
                var link = domConstruct.create("a", {
                    href: 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(text),
                    target: '_blank',
                    download: filename
                }, this.container);
            }else {
                var link = domConstruct.create("a", {
                    href: 'data:text/plain;charset=utf-8,' + encodeURI(text),
                    download: filename
                });
            }
            if (link) {
                link.click();
                domConstruct.destroy(link);
            }
        },

        // Solutions: Added case to handle fields structure coming from a map service.
        // also added a small integer into summary types.
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
            for (var i = 0; i < fldInfos.length; i++) {
                var fld = fldInfos[i];
                var fldType = layer.fields[i].type;
                //if (fld.visible && fld.fieldName !== layer.objectIdField &&
                if (fld.name !== layer.objectIdField &&
                  (fldType === "esriFieldTypeDouble" || fldType === "esriFieldTypeInteger" ||
                  fldType === "esriFieldTypeSmallInteger")) {
                    if(typeof(fld.visible) !== 'undefined') {
                        if (fld.visible) {
                            var obj = {
                                field: fld.fieldName,
                                alias: fld.label,
                                total: 0
                            };
                        }
                    }
                    else {
                        var obj = {
                            field: fld.name,
                            alias: fld.alias,
                            total: 0
                        };
                    }
                    if (obj) {
                        fields.push(obj);
                    }
                    obj = null;
                }
            }

            var attributeField = null;
            if (layer.renderer) {
                if (layer.renderer.attributeField) {
                    attributeField = {
                        field: layer.renderer.attributeField,
                        alias: layer.renderer.attributeField,
                        total: 0
                    };
                    //should make sure this doesn't already contain this
                    //fields.push(attributeField);
                    this.symbolField = attributeField;
                }
                else if (layer.renderer.symbol) {
                    //TODO check if this could be useful or necessary symbol would 
                    //obviously be smaller than the renderer for storage when an attribute field is not involved
                    this.lyrSymbol = layer.renderer.symbol;
                }
            }

            return fields;
        }

    });

    return summaryInfo;

});
