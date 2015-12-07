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
  'dijit/form/Select',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/dom',
  'dojo/dom-class',
  'dojo/on',
  'dojo/query',
  'jimu/BaseWidget',
  'jimu/dijit/SimpleTable',
  'esri/layers/FeatureLayer',
  'dojo/text!./FieldStatPicker.html',
  'dojo/Evented'],
function(declare,
  _WidgetsInTemplateMixin,
  Select,
  array,
  lang,
  html,
  dom,
  domClass,
  on,
  query,
  BaseWidget,
  SimpleTable,
  FeatureLayer,
  template,
  Evented) {
  return declare([BaseWidget, _WidgetsInTemplateMixin, Evented], {
    templateString : template,
    baseClass : 'jimu-widget-IMT-setting',
    summaryLayers : [],
    operationsList : [{
      value : 'area',
      label : 'Area'
    }, {
      value : 'avg',
      label : 'Average'
    }, {
      value : 'count',
      label : 'Count'
    }, {
      value : 'length',
      label : 'Length'
    }, {
      value : 'max',
      label : 'Maximum'
    }, {
      value : 'min',
      label : 'Minimum'
    }, {
      value : 'sum',
      label : 'Summation'
    }],
    fieldsList : null,
    callerLayer : null,
    callerTab : null,
    callerOpLayers: null,
    layerList: null,

    constructor : function(/*Object*/args) {
      this.map = args.map;
    },

    postCreate : function() {
      this.inherited(arguments);
      this.startup();
    },

    startup : function() {
      //this.inherited(arguments);
      var title = dom.byId(this.divLayerTitle).innerHTML;
      dom.byId(this.divLayerTitle).innerHTML = title + " " + this.callerLayer;

      this.own(on(this.btnCancel, 'click', lang.hitch(this, function() {
        this.emit('cancel');
      })));

      this.own(on(this.btnOk, 'click', lang.hitch(this, function() {
        this.updateSummaryType();
        this.emit('ok', this.summaryLayers);
      })));

      this.layerTables = [];
      this.summaryLayers = [];
      this._getAllValidLayers();

      this.own(on(this.btnAddField, 'click', lang.hitch(this, this._addTabRow)));

      this.own(on(this.fieldTable, 'row-delete', lang.hitch(this, function() {
        var rows = this.fieldTable.getRows();
        if (rows.length <= 0) {
          html.addClass(this.btnOk, 'jimu-state-disabled');
        }
      })));

    },

    _getAllValidLayers: function() {
      array.forEach(this.callerOpLayers, lang.hitch(this, function(OpLyr) {
        if(OpLyr.newSubLayers.length > 0) {
          this._recurseOpLayers(OpLyr.newSubLayers);
        } else {
          if(OpLyr.title === this.callerLayer) {
            this.layerList = OpLyr;
          }
        }
      }));
      if(this.layerList.layerObject.empty) {
        var tempFL = new FeatureLayer(this.layerList.layerObject.url);
        on(tempFL, "load", lang.hitch(this, function() {
          this._completeMapLayers(tempFL);
        }));
      } else {
        this._completeMapLayers(this.layerList);
      }
    },

    _recurseOpLayers: function(pNode) {
      var nodeGrp = pNode;
      array.forEach(nodeGrp, lang.hitch(this, function(Node) {
        if(Node.newSubLayers.length > 0) {
          this._recurseOpLayers(Node.newSubLayers);
        } else {
          if(Node.title === this.callerLayer) {
            this.layerList = Node;
          }
        }
      }));
    },


    //After the class has returned layers, push only Featurelayers and Layers into the layer list.
    _completeMapLayers : function(args) {
      if (args) {
        var layer = args;
        var tempLayer = [];
        if(typeof(layer.layerObject) === 'undefined') {
          tempLayer = {
            "url" : layer.url,
            "name" : layer.name,
            "stats" : {}
          };
          fields = lang.clone(layer.fields);
        } else {
          tempLayer = {
            "url" : layer.layerObject.url,
            "name" : layer.title,
            "stats" : {}
          };
          fields = lang.clone(layer.layerObject.fields);
        }
        this.summaryLayers.push(tempLayer);

        if (this.summaryLayers.length >= 1) {
          this._setFields(fields);
          if ( typeof (this.callerTab.advStat) !== 'undefined') {
            var statGroup = this.callerTab.advStat.stats;
            for (var key in statGroup) {
              array.forEach(statGroup[key], lang.hitch(this, function(exp) {
                this._populateTabTableRow(key, exp);
              }));
            }
            if (domClass.contains(this.btnOk, 'jimu-state-disabled')) {
              html.removeClass(this.btnOk, 'jimu-state-disabled');
            }
          }
        } else {
          //this._noLayersDisplay();
        }

      }

    },

    _setFields : function(pFields) {
      var validFieldTypes = ['esriFieldTypeInteger', 'esriFieldTypeSmallInteger', 'esriFieldTypeDouble', 'esriFieldTypeOID'];
      var options = [];
      array.forEach(pFields, lang.hitch(this, function(field) {
        if(validFieldTypes.indexOf(field.type) > -1) {
          if ((field.alias).toUpperCase() === 'OBJECTID') {
            options.push({
              'label' : 'Features',
              'value' : field.name
            });
          } else {
            options.push({
              'label' : field.alias,
              'value' : field.name
            });
          }
        }
      }));

      this.fieldsList = lang.clone(options);
    },

    _populateTabTableRow : function(pKey, pTab) {
      var result = this.fieldTable.addRow({});
      if (result.success && result.tr) {
        var tr = result.tr;
        this._addTabFields(tr);
        this._addTabTypes(tr);
        tr.selectFields.set("value", pTab.expression);
        tr.selectTypes.set("value", pKey);
      }
    },

    _addTabRow : function() {
      var result = this.fieldTable.addRow({});
      if (result.success && result.tr) {
        var tr = result.tr;
        this._addTabFields(tr);
        this._addTabTypes(tr);
        if (domClass.contains(this.btnOk, 'jimu-state-disabled')) {
          html.removeClass(this.btnOk, 'jimu-state-disabled');
        }
      }
    },

    _addTabFields : function(tr) {
      var lyrOptions = lang.clone(this.fieldsList);
      var td = query('.simple-table-cell', tr)[0];
      if (td) {
        html.setStyle(td, "verticalAlign", "middle");
        var tabLayers = new Select({
          style : {
            width : "100%",
            height : "30px"
          },
          options : lyrOptions
        });
        tabLayers.placeAt(td);
        tabLayers.startup();
        tr.selectFields = tabLayers;
      }
    },

    _addTabTypes : function(tr) {
      var typeOptions = lang.clone(this.operationsList);
      var td = query('.simple-table-cell', tr)[1];
      if (td) {
        html.setStyle(td, "verticalAlign", "middle");
        var tabTypes = new Select({
          style : {
            width : "100%",
            height : "30px"
          },
          options : typeOptions
        });
        tabTypes.placeAt(td);
        tabTypes.startup();
        tr.selectTypes = tabTypes;
      }
    },

    updateSummaryType : function() {

      var trs = this.fieldTable.getRows();
      array.forEach(trs, lang.hitch(this, function(tr) {
        console.log(tr.selectFields);
        if ( typeof (this.summaryLayers[0].stats[tr.selectTypes.value]) === 'undefined') {
          this.summaryLayers[0].stats[tr.selectTypes.value] = [];
        }
        var statBlock = {};
        statBlock.value = 0;
        statBlock.expression = tr.selectFields.value;
          //old approach would fail in firefox
        for (var i = 0; i < tr.selectFields.options.length; i++) {
            if (tr.selectFields.options[i].value === tr.selectFields.value) {
                statBlock.label = tr.selectFields.options[i].label;
                break;
            }
        }
        if (typeof (statBlock.label) === 'undefined') {
            statBlock.label = statBlock.expression;
        }
        this.summaryLayers[0].stats[tr.selectTypes.value].push(statBlock);

      }));

    },

    destroy : function() {
      this.summaryLayers = null;
    }
  });
});
