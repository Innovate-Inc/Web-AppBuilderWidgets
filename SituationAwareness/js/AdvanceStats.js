///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/promise/all',
  'dojo/Deferred',
  'jimu/BaseWidget',
  'esri/geometry/geometryEngine',
  'esri/tasks/QueryTask',
  'esri/tasks/query',
  'esri/tasks/StatisticDefinition',
  'dojo/Evented'],
function(declare,
  _WidgetsInTemplateMixin,
  array,
  lang,
  all,
  Deferred,
  BaseWidget,
  geometryEngine,
  QueryTask,
  Query,
  StatisticDefinition,
  Evented) {
  return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
    summaryLayers : [],
    summaryGeom : null,
    summaryIds : [],
    summaryLength : [],
    summaryArea : [],
    summaryFeature : null,
    config : null,

    constructor : function(pLayer, pFeatureLayer, pGeom, pThis) {
      this.summaryLayers = [];
      this.summaryGeom = null;
      this.summaryFeature = pFeatureLayer;
      this.summaryLayers.push(pLayer);
      this.summaryGeom = pGeom;
      this.summaryIds = [];
      this.config = pThis.config;
    },

    postCreate : function() {
      //this.inherited(arguments);
      this.startup();
    },

    startup : function() {
      this.inherited(arguments);

      this.prepGeomToService(this.summaryLayers, this.summaryGeom);
    },

    // Determine if the layer supports Spatial stats (ags 10.1 or higher) if does, prep for spatial stats
    // otherwise prep for regular query. all queries are tossed in deferred
    prepGeomToService : function(pLayer, pGeom) {
      var layer = pLayer[0];
      var requestList = [];
      var summaryCount = 0;
      if (this.summaryFeature.supportsStatistics) {
        for (var key in layer.advStat.stats) {
          if (layer.advStat.stats.hasOwnProperty(key)) {
            if (layer.advStat.stats[key].length > 0) {
              summaryCount += layer.advStat.stats[key].length;
              array.forEach(layer.advStat.stats[key], lang.hitch(this, function(pStat) {
                var statKey = key;
                if (statKey !== 'area' && statKey !== 'length') {
                  requestList.push(this._queryByStatsDef(layer, pGeom, pStat, statKey));
                } else {
                  //need to handle area and length differently. They are not included in stats definition.
                  //need to just loop through records.
                  var query = new Query();
                  query.geometry = pGeom;
                  var queryTask = new QueryTask(layer.advStat.url);
                  queryTask.executeForIds(query, lang.hitch(this, function(objectIds) {
                    //layer.tabLayers[0].queryIds(query, lang.hitch(this, function(objectIds) {
                    this.summaryIds = objectIds;
                    if (this.summaryIds.length > 0) {
                      var max = 1000;
                      if ( typeof (layer.tabLayers[0]) !== 'undefined') {
                        if ( typeof (layer.tabLayers[0].maxRecordCount) !== 'undefined') {
                          max = layer.tabLayers[0].maxRecordCount;
                        }
                      };
                      while (this.summaryIds.length > 0) {
                        var ids = this.summaryIds.slice(0, max);
                        this.summaryIds.splice(0, max);
                        requestList.push(this._queryGeomStatByIds(layer, pGeom, ids, pStat, statKey));
                      }
                      if (summaryCount === requestList.length) {
                        all(requestList).then(lang.hitch(this, function(results) {
                          this._requestCompletePrep();
                        }));
                      }
                    }
                  }));

                }

              }));

            }
          }
        }
      } else {
        //using map service 10.1 or older. DOn't loop through the advance stats.  Pull the records first
        //then see what advance stats needs to be applied to them.

        var query = new Query();
        query.geometry = pGeom;
        var queryTask = new QueryTask(layer.advStat.url);
        queryTask.executeForIds(query, lang.hitch(this, function(objectIds) {
          //layer.tabLayers[0].queryIds(query, lang.hitch(this, function(objectIds) {
          this.summaryIds = objectIds;
          if (this.summaryIds.length > 0) {
            var max = 1000;
            if ( typeof (layer.tabLayers[0]) !== 'undefined') {
              if ( typeof (layer.tabLayers[0].maxRecordCount) !== 'undefined') {
                max = layer.tabLayers[0].maxRecordCount;
              }
            };
            var recordCount = this.summaryIds.length;
            while (this.summaryIds.length > 0) {
              var ids = this.summaryIds.slice(0, max);
              this.summaryIds.splice(0, max);
              requestList.push(this._queryStatsByIds(layer, pGeom, ids, recordCount));
            }
            all(requestList).then(lang.hitch(this, function(results) {
              this._requestCompletePrep();
            }));
          }
        }));

      }

      if (summaryCount === requestList.length) {
        all(requestList).then(lang.hitch(this, function(results) {
          this._requestCompletePrep();
        }));
      }

    },

    // If feature layer supports stats def, use it.
    _queryByStatsDef : function(pLayer, pGeom, pStat, pStatKey) {
      var deferred = new Deferred();
      var queryTask = new QueryTask(pLayer.advStat.url);
      var query = new Query();
      query.returnGeometry = false;
      query.geometry = pGeom;
      query.outFields = ["*"];
      var statisticDefinition = new StatisticDefinition();
      statisticDefinition.statisticType = pStatKey;
      statisticDefinition.onStatisticField = pStat.expression;
      statisticDefinition.outStatisticFieldName = pStat.expression;
        //jh commented out...we had fields with alias names like "# of beds"
        //from the doc: Output field names can only contain alpha-numeric characters and an underscore.
      //statisticDefinition.outStatisticFieldName = pStat.label;
      query.outStatistics = [statisticDefinition];

      queryTask.execute(query, lang.hitch(this, function(results) {
        var struct = {};
        array.forEach(results.features, lang.hitch(this, function(feature) {
          for (var key in feature.attributes) {
            pStat.value = feature.attributes[key];
          }
        }));
        deferred.resolve("done");
      }), lang.hitch(this, function() {
        deferred.resolve("error occurred");
        //this._callbackQueryError(layer,statKey,pStat.expression);
      }));
      return deferred.promise;
    },

    // For any AREA or LENGTH summary, query and send to function to perform computation
    _queryGeomStatByIds : function(pLayer, pGeom, pIds, pStat, pStatKey) {
      var deferred = new Deferred();
      var query = new Query();
      query.returnGeometry = true;
      query.outFields = ['*'];
      query.objectIds = pIds;
      query.outSpatialReference = pGeom.spatialReference;
      var queryTask = new QueryTask(pLayer.advStat.url);
      queryTask.execute(query, lang.hitch(this, function(featureSet) {

        this._geomSummary(pLayer, pGeom, featureSet, pStatKey);

        deferred.resolve("done");
      }));
      return deferred.promise;
    },

    // Stats not using stats Def, using array operations to do the various stats.
    _queryStatsByIds : function(pLayer, pGeom, pIds, pRecs) {
      var deferred = new Deferred();
      var query = new Query();
      query.returnGeometry = true;
      query.outFields = ['*'];
      query.objectIds = pIds;
      query.outSpatialReference = pGeom.spatialReference;
      var queryTask = new QueryTask(pLayer.advStat.url);
      queryTask.execute(query, lang.hitch(this, function(featureSet) {
        var graphics = featureSet.features;

        for (var key in pLayer.advStat.stats) {
          if (pLayer.advStat.stats.hasOwnProperty(key)) {
            if (pLayer.advStat.stats[key].length > 0) {
              array.forEach(pLayer.advStat.stats[key], lang.hitch(this, function(stat) {
                //array.forEach(graphics, lang.hitch(this, function(result) {
                if (key === 'max') {
                  var maxFilter = array.map(graphics, function(matchField) {
                    return matchField.attributes[stat.expression];
                  });
                  maxFilter.sort(function(a, b) {
                    return b - a
                  });
                  if (maxFilter[0] > stat.value) {
                    stat.value = maxFilter[0];
                  }
                }
                if (key === 'min') {
                  var minFilter = array.map(graphics, function(matchField) {
                    return matchField.attributes[stat.expression];
                  });
                  minFilter.sort(function(a, b) {
                    return a - b
                  });
                  if (stat.value === 0) {
                    stat.value = minFilter[0];
                  } else {
                    if (minFilter[0] < stat.value) {
                      stat.value = minFilter[0];
                    }
                  }
                }
                if (key === 'sum') {
                  var sumFilter = array.map(graphics, function(matchField) {
                    return matchField.attributes[stat.expression];
                  });
                  var sumVal = sumFilter.reduce(function(a, b) {
                    return a + b
                  }, 0);
                  stat.value += sumVal;
                }
                if (key === 'avg') {
                  var sumFilter = array.map(graphics, function(matchField) {
                    return matchField.attributes[stat.expression];
                  });
                  var sumVal = sumFilter.reduce(function(a, b) {
                    return a + b
                  }, 0);
                  stat.value += sumVal;
                  if (this.summaryIds.length <= 0) {
                    stat.value = parseFloat(stat.value / pRecs);
                  }
                }
                if (key === 'count') {
                  stat.value += graphics.length;
                }
                if (key === 'area' || key === 'length') {
                  this._geomSummary(pLayer, pGeom, featureSet, key);
                }
                //}));
              }));
            }
          }
        }
        deferred.resolve("done");
      }));
      return deferred.promise;
    },

    //For ARea or Length, loop through the record set and clip area in, then perform calculations.
    // the units of return are what the settings page were set as.
    _geomSummary : function(pLayer, pGeom, pFeatureSet, pStatKey) {
      var unit1;
      var unitCode;
      if (pStatKey === "area") {
        var areaUnit = lang.clone(this.config.distanceSettings);
        areaUnit.miles = 109413;
        areaUnit.kilometers = 109414;
        areaUnit.feet = 109405;
        areaUnit.meters = 109404;
        areaUnit.yards = 109442;
        areaUnit.nauticalMiles = 109409;
        var unit1 = this.config.distanceUnits;
        var unitCode = areaUnit[unit1];
      } else {
        var unit1 = this.config.distanceUnits;
        var unitCode = this.config.distanceSettings[unit1];
      }

      var graphics = pFeatureSet.features;
      array.forEach(pLayer.advStat.stats[pStatKey], lang.hitch(this, function(stat) {
        array.forEach(graphics, lang.hitch(this, function(result) {
          if (result.geometry !== null) {
            var intersectGeom = geometryEngine.intersect(result.geometry, pGeom);
            if (pStatKey === "area") {
              var area = 0;
              if (intersectGeom === null) {
                area = 0;
              } else {
                area = geometryEngine.geodesicArea(intersectGeom, unitCode);
              }
              stat.value += area;
            } else {
              var len = 0;
              if (intersectGeom === null) {
                len = 0;
              } else {
                len = geometryEngine.geodesicLength(intersectGeom, unitCode);
              }
              stat.value += len;
            }
          }
        }));
      }));
    },

    // After all request are done, format the response and then emit it back out to caller.
    _requestCompletePrep : function() {
      var resultSet = [];
      var struct = {};
      var layer = this.summaryLayers[0];
      for (var key in layer.advStat.stats) {
        array.forEach(layer.advStat.stats[key], lang.hitch(this, function(stat) {
          struct = {};
          if (stat.expression === 'OBJECTID') {
            struct.alias = "Features (<span style='font-size:7pt;'>" + key + "</span>)";
          } else {
            struct.alias = stat.label + " (<span style='font-size:7pt;'>" + key + "</span>)";
          }
          struct.field = stat.expression;
          struct.total = stat.value;
          resultSet.push(struct);
        }));
      }
      this.emit('complete', resultSet);
      this.destroy();
    },

    _callbackQueryError : function() {
      console.log("error");
    }
  });
});
