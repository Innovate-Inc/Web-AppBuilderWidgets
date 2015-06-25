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
        'dijit/form/RadioButton',
        'dijit/form/Button',
        'dijit/form/SimpleTextarea',
        'dijit/form/TextBox',
        'jimu/BaseWidgetSetting',
        'jimu/dijit/SimpleTable',
        'dojo/query',
        'dojo/_base/html',
        'dojo/dom-style',
        'dojo/_base/array',
        'dojo/on',
        'dojo/_base/lang',
        'dojo/json',
        'dijit/form/Select',
        'dojo/dom-construct',
        'jimu/dijit/SymbolChooser',
        'esri/symbols/jsonUtils',
        'esri/layers/FeatureLayer',
        './layerDetails'], 
function(declare, 
        _WidgetsInTemplateMixin,
        RadioButton,
        Button,
        SimpleTextarea,
        TextBox,
        BaseWidgetSetting,
        SimpleTable,
        query,
        html,
        domStyle,
        array,
        on,
        lang,
        JSON,
        Select,
        domConstruct,
        SymbolChooser,
        symbolJsonUtils,
        FeatureLayer,
        layerDetails) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    //these two properties is defined in the BaseWidget
    baseClass : 'solutions-widget-geolookup-setting',
    layersTable : null,
    currentLayer : null,
    selectedFields : [],
    layerList : [],
    startup : function() {
      this.inherited(arguments);
      if (this.config === null) {
        this.config = {};

      }
      if (this.config === undefined) {
        this.config = {};

      }
      if (this.config === '') {
        this.config = {};

      }
      this.setConfig(this.config);

      //Create a Layer and fields table object container
      this.createLayerTable();
      this.createFieldsTable();
      //This code calls a class.  This class takes the map object and will 
      //return an array of layers and sublayers once complete event is fired.
      //If there are no operational layers, find buttons and only let user cancel.
      this.layerList = [];
      if ((this.map.itemInfo.itemData.operationalLayers).length > 0) {
        var lyrDet = new layerDetails(this.map);
        lyrDet.getAllMapLayers();
        on(lyrDet, 'complete', lang.hitch(this, this._completeLayerDetails));
      } else {
        this._noLayersDisplay();
      }
    },

    //This function creates custom buttonsfor advanced functions. If no polygon layers, all these get hidden
    loadCustomButtons : function(valid) {
      try {
        var btnBar = (this.domNode.parentNode.parentNode.parentNode.parentNode.lastChild.lastChild);
        var btnOKLocation = (this.domNode.parentNode.parentNode.parentNode.parentNode.lastChild.lastChild.previousSibling);

        this.btnAdvSettings = domConstruct.toDom("<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1'>" + this.nls.advSettingsBtn + "</div>");
        on(this.btnAdvSettings, 'click', lang.hitch(this, this.showAdvSettings));

        this.btnSaveFields = domConstruct.toDom("<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hideGLItem'>" + this.nls.saveFields + "</div>");
        on(this.btnSaveFields, 'click', lang.hitch(this, this.saveFields));

        this.btnCancelFields = domConstruct.toDom("<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hideGLItem'>" + this.nls.cancelFields + "</div>");
        on(this.btnCancelFields, 'click', lang.hitch(this, this.cancelFields));

        this.btnSaveAdv = domConstruct.toDom("<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hideGLItem'>" + this.nls.saveAdv + "</div>");
        on(this.btnSaveAdv, 'click', lang.hitch(this, this.saveAdv));

        this.btnCancelAdv = domConstruct.toDom("<div class='jimu-popup-btn jimu-float-trailing jimu-leading-margin1 hideGLItem'>" + this.nls.cancelAdv + "</div>");
        on(this.btnCancelAdv, 'click', lang.hitch(this, this.cancelAdv));

        this.btnErrorMsg = domConstruct.toDom("<div class='settings-error hideGLItem'></div>");

        if (valid) {
          domConstruct.place(this.btnAdvSettings, btnBar, 'after');
          domConstruct.place(this.btnSaveAdv, this.btnAdvSettings, 'after');
          domConstruct.place(this.btnCancelAdv, this.btnSaveAdv, 'after');
          domConstruct.place(this.btnSaveFields, this.btnCancelAdv, 'after');
          domConstruct.place(this.btnCancelFields, this.btnSaveFields, 'after');
          domConstruct.place(this.btnErrorMsg, this.btnCancelFields, 'after');
        } else {
          html.addClass(btnOKLocation, 'hideGLItem');
        }

      } catch (err) {
        console.log(err.message);
      }
    },

    setConfig : function(config) {
      this.config = config;
      var error = array.forEach(this.config.enrichLayers, function(row) {
        this.selectedFields[row.id] = row.fields;
      }, this);
      var sym;
      if (this.config.SymbolWithin) {
        sym = symbolJsonUtils.fromJson(this.config.SymbolWithin);
        if (sym) {
          this.symbolWithin.showBySymbol(sym);
        }
      }
      if (this.config.SymbolOutside) {
        sym = symbolJsonUtils.fromJson(this.config.SymbolOutside);
        if (sym) {
          this.symbolOutside.showBySymbol(sym);
        }
      }
    },
    getConfig : function() {
      this.config.SymbolWithin = this.symbolWithin.getSymbol().toJson();
      this.config.SymbolOutside = this.symbolOutside.getSymbol().toJson();
      var data = this.layersTable.getData();
      this.config.enrichLayers = [];
      var layersValid = false;
      var error = array.some(data, function(row) {
        if (row.enrich) {
          var enrichLayer = {};
          enrichLayer.id = row.id;
          enrichLayer.label = row.label;
          enrichLayer.url = row.url;
          enrichLayer.name = row.name;
          if (!this.selectedFields[enrichLayer.id]) {
            return true;
          }
          enrichLayer.fields = this.selectedFields[enrichLayer.id];
          this.config.enrichLayers.push(enrichLayer);
          layersValid = true;
        }
      }, this);
      if (error || layersValid === false) {
        this.showOKError();
        return false;
      }

      return this.config;
    },

    //After the class has returned layers, push only Featurelayers and Layers into the layer list.
    _completeLayerDetails : function(args) {
      if (args) {
        array.forEach(args.data.items, lang.hitch(this, function(layer) {
          if (layer.type === 'Feature Layer') {
            this.layerList.push(layer);
          } else if (layer.type === 'Service') {
            array.forEach(layer.children, lang.hitch(this, function(subLayer) {
              if (subLayer.type === 'Layer') {
                this.layerList.push(subLayer);
              }
            }));
          } else {
          }
        }));
        if (this.layerList.length >= 1) {
          this.loadLayerTable();
        } else {
          this._noLayersDisplay();
        }
      }
    },

    //Load the layer table with the layers in the Layerlist. Only list the ploygon layers.
    loadLayerTable : function() {
      var label = '';
      var tableValid = false;
      var enrich = false;
      array.forEach(this.layerList, function(layer) {
        if (layer.id !== null && layer.id !== undefined) {
          if ((layer.type === 'Feature Layer' || layer.type === 'Layer') && layer.url && layer.geometryType === 'esriGeometryPolygon') {
            label = layer.label;
            enrich = false;

            var filteredArr = array.filter(this.config.enrichLayers, function(layerInfo) {
              return layerInfo.id === layer.id;
            });
            if (filteredArr.length > 0) {
              enrich = true;
            }
            var row = this.layersTable.addRow({
              label : label,
              enrich : enrich,
              id : layer.id,
              url : layer.url
            });
            tableValid = true;

          }
        }
      }, this);

      if (!tableValid) {
        this.loadCustomButtons(false);
        domStyle.set(this.tableLayerInfosError, 'display', '');
      } else {
        this.loadCustomButtons(true);
        domStyle.set(this.tableLayerInfosError, 'display', 'none');
      }
    },
    
    //This creates the layer table structure
    createLayerTable : function() {
      var layerTableFields = [{
        name : 'enrich',
        title : this.nls.layerTable.colEnrich,
        type : 'checkbox',
        'class' : 'enrich'
      }, {
        name : 'label',
        title : this.nls.layerTable.colLabel,
        type : 'text'
      }, {
        name : 'actions',
        title : this.nls.layerTable.colFieldSelector,
        type : 'actions',
        'class' : 'fieldselector',
        actions : ['edit']
      }, {
        name : 'id',
        type : 'text',
        hidden : true
      }, {
        name : 'url',
        type : 'text',
        hidden : true
      }];
      var args = {
        fields : layerTableFields,
        selectable : false
      };
      domConstruct.empty(this.tableLayerInfos);
      this.layersTable = new SimpleTable(args);
      this.layersTable.placeAt(this.tableLayerInfos);
      this.layersTable.startup();
      this.own(on(this.layersTable, 'actions-edit', lang.hitch(this, this.showLayerFields)));

    },
    //This creates the fields table structure.  This only gets called when the parent layer table buttonis clicked
    createFieldsTable : function() {
      var layerFields = [{
        name : 'isAppended',
        title : this.nls.fieldTable.colAppend,
        type : 'checkbox',
        'class' : 'appended'
      }, {
        name : 'fieldName',
        title : this.nls.fieldTable.colName,
        type : 'text'
      }, {
        name : 'label',
        title : this.nls.fieldTable.colAlias,
        type : 'text',
        editable : true
      }];
      var layerFieldArgs = {
        fields : layerFields,
        selectable : false
      };
      this.layerFieldsTable = new SimpleTable(layerFieldArgs);
      this.layerFieldsTable.placeAt(this.tableFieldInfos);
      this.layerFieldsTable.startup();
    },
    //Loads the field table
    showLayerFields : function(tr) {
      this.currentLayer = null;
      var tds = query('.action-item-parent', tr);
      if (tds && tds.length) {
        var rowData = this.layersTable.getRowData(tr);
        this.layerFieldsTable.clear();

        var layer;
        array.forEach(this.layerList, lang.hitch(this, function(lyr) {
          if (lyr.id === rowData.id) {
            layer = lyr;
          }
        }));
        if (layer) {
          if (layer.children) {
            var fields = this.selectedFields[rowData.id];
            var filtFields;
            var filtAlias;
            var isAppended;
            if (fields) {
              filtFields = array.map(fields, function(field) {
                return field.fieldName;
              });
              filtAlias = array.map(fields, function(field) {
                return field.label;
              });
            }
            var fields = layer.children;
            array.forEach(fields, function(field) {
              aliasLabel = field.label;
              isAppended = false;
              if (filtFields) {
                if (filtFields.indexOf(field.name) >= 0) {
                  isAppended = true;
                  aliasLabel = filtAlias[filtFields.indexOf(field.name)];
                }
              }
              this.layerFieldsTable.addRow({
                fieldName : field.name,
                label : aliasLabel,
                isAppended : isAppended
              });
            }, this);
            html.addClass(this.mainPage, 'hideGLItem');
            html.addClass(this.btnAdvSettings, 'hideGLItem');
            html.removeClass(this.fieldsPage, 'hideGLItem');
            html.removeClass(this.btnSaveFields, 'hideGLItem');
            html.removeClass(this.btnCancelFields, 'hideGLItem');
            this.currentLayer = rowData.id;
          }
        }
      }
    },
    //The next couple functions handle button actions
    saveFields : function() {
      var data = this.layerFieldsTable.getData();
      var fields = [];
      var field;
      array.forEach(data, function(row) {
        if (row.isAppended === true) {
          field = {};
          field.fieldName = row.fieldName;
          field.label = row.label;

          fields.push(field);
        }
      }, this);

      this.selectedFields[this.currentLayer] = fields;
      html.removeClass(this.mainPage, 'hideGLItem');
      html.addClass(this.fieldsPage, 'hideGLItem');
      html.addClass(this.btnSaveFields, 'hideGLItem');
      html.addClass(this.btnCancelFields, 'hideGLItem');
      html.removeClass(this.btnAdvSettings, 'hideGLItem');
    },
    cancelFields : function() {
      html.removeClass(this.mainPage, 'hideGLItem');
      html.addClass(this.fieldsPage, 'hideGLItem');
      html.addClass(this.btnSaveFields, 'hideGLItem');
      html.addClass(this.btnCancelFields, 'hideGLItem');
      html.removeClass(this.btnAdvSettings, 'hideGLItem');

    },
    cancelAdv : function() {
      html.removeClass(this.mainPage, 'hideGLItem');
      html.addClass(this.advSettingsPage, 'hideGLItem');
      html.addClass(this.btnSaveAdv, 'hideGLItem');
      html.addClass(this.btnCancelAdv, 'hideGLItem');
      html.removeClass(this.btnAdvSettings, 'hideGLItem');
    },
    saveAdv : function() {
      html.removeClass(this.mainPage, 'hideGLItem');
      html.addClass(this.advSettingsPage, 'hideGLItem');
      html.addClass(this.btnSaveAdv, 'hideGLItem');
      html.addClass(this.btnCancelAdv, 'hideGLItem');
      html.removeClass(this.btnAdvSettings, 'hideGLItem');

      var val;
      var valSpl;
      val = this.advSettingsLatValues.get('value');
      valSpl = val.split('\n');
      this.config.latFields = [];
      array.forEach(valSpl, function(value) {
        if (value != '') {
          this.config.latFields.push(value);
        }
      }, this);

      val = this.advSettingsLongValues.get('value');
      valSpl = val.split('\n');
      this.config.longFields = [];
      array.forEach(valSpl, function(value) {
        if (value != '') {
          this.config.longFields.push(value);
        }
      }, this);
      this.config.intersectField = this.advSettingsIntersectField.get('value');
      this.config.valueIn = this.advSettingsIntersectInValue.get('value');
      this.config.valueOut = this.advSettingsIntersectOutValue.get('value');
      this.config.cacheNumber = this.advSettingsCacheNumber.get('value');
      this.config.maxRowCount = this.advSettingsMaxRowCount.get('value');
    },
    //When  user clicks advance setting, show some custom Dom with settings to change
    showAdvSettings : function() {

      var val = '';

      array.forEach(this.config.latFields, function(value) {
        val = val + value + '\n';
      }, this);
      this.advSettingsLatValues.set('value', val);

      val = '';
      array.forEach(this.config.longFields, function(value) {
        val = val + value + '\n';
      }, this);
      this.advSettingsLongValues.set('value', val);

      this.advSettingsIntersectField.set('value', this.config.intersectField);
      this.advSettingsIntersectInValue.set('value', this.config.valueIn);
      this.advSettingsIntersectOutValue.set('value', this.config.valueOut);
      this.advSettingsCacheNumber.set('value', this.config.cacheNumber);
      this.advSettingsMaxRowCount.set('value', this.config.maxRowCount);

      html.addClass(this.mainPage, 'hideGLItem');
      html.removeClass(this.advSettingsPage, 'hideGLItem');
      html.removeClass(this.btnSaveAdv, 'hideGLItem');
      html.removeClass(this.btnCancelAdv, 'hideGLItem');
      html.addClass(this.btnAdvSettings, 'hideGLItem');
    },
    showOKError : function() {
      this.btnErrorMsg.innerHTML = this.nls.errorOnOk;
      html.removeClass(this.btnErrorMsg, 'hideGLItem');

    },
    hideOkError : function() {

      html.addClass(this.btnErrorMsg, 'hideGLItem');

    },
    _noLayersDisplay : function() {
      domStyle.set(this.tableLayerInfosError, 'display', '');
      this.loadCustomButtons(false);
    }
  });
}); 