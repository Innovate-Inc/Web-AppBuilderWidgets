///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/html',
    'dojo/dom-style',
    'dojo/on',
    'dojo/query',
    'dijit/form/Select',
    'dijit/form/ValidationTextBox',
    'dijit/_WidgetsInTemplateMixin',
    './FeaturelayerSource',
    'jimu/BaseWidgetSetting',
    'jimu/dijit/Message',
    'jimu/dijit/Popup',
    'jimu/dijit/SimpleTable'
  ],
  function(
    declare, array, lang, html, domStyle, on, query,
    Select, ValidationTextBox, _WidgetsInTemplateMixin,
    FeaturelayerSource, BaseWidgetSetting, Message, Popup
  ) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {

      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-IMT-setting',

      postCreate: function() {
        this.inherited(arguments);
        this._setLayers();
        this._setTypes();
        this.own(on(this.btnAddTab, 'click', lang.hitch(this, this._addTabRow)));
        this.own(on(this.tabTable, 'row-delete', lang.hitch(this, function(tr) {
          if (tr.select) {
            tr.select.destroy();
            delete tr.select;
          }
        })));
      },

      startup: function() {
        this.inherited(arguments);
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;

        if (this.config.distanceUnits) {
          this.selectUnits.set("value", this.config.distanceUnits);
        }

        if (this.config.maxDistance) {
          this.txt_maximumDistance.set("value", this.config.maxDistance);
        }

        if (this.config.enableRouting) {
          this.chk_routing.set('value', true);
        }

        this.tabTable.clear();
        for (var i = 0; i < this.config.tabs.length; i++) {
          var aTab = this.config.tabs[i];
          if (aTab.type === this.config.special_layer.value) {
            this.chk_weather.set('value', true);
            this.weatherTabAdditionalLayers = aTab.layers;
            this.currentlySelectedLayer.innerHTML = this.weatherTabAdditionalLayers;
          } else {
            this._populateTabTableRow(aTab);
          }
        }

        this.buffer_lbl.set("value", this.config.bufferLabel ?
          this.config.bufferLabel : this.nls.buffer_lbl);

        this.buffer_max.set("value", this.config.bufferRange.maximum);
        this.buffer_min.set("value", this.config.bufferRange.minimum);
      },

      getConfig: function() {

        this.config.distanceUnits = this.selectUnits.value;

        if (this.txt_maximumDistance.value) {
          this.config.maxDistance = this.txt_maximumDistance.value;
        }

        if (this.chk_routing.checked) {
          this.config.enableRouting = true;
        } else {
          this.config.enableRouting = false;
        }

        var tabs = [];

        var aTab = {};
        if (this.chk_weather.checked) {
          aTab.label = this.config.special_layer.label;
          aTab.type = this.config.special_layer.value;
          aTab.layers = this.weatherTabAdditionalLayers;
          aTab.url = this.config.special_layer.url;
          tabs.push(aTab);
        }

        var trs = this.tabTable.getRows();
        array.forEach(trs, lang.hitch(this, function(tr) {
          var selectLayers = tr.selectLayers;
          var selectTypes = tr.selectTypes;
          var labelText = tr.labelText;
          aTab = {};
          aTab.label = labelText.value;
          aTab.type = selectTypes.value;
          aTab.layers = selectLayers.value;
          tabs.push(aTab);
        }));

        this.config.tabs = tabs;
        this.config.bufferLabel = this.buffer_lbl.value;
        this.config.bufferRange.maximum = this.buffer_max.value;
        this.config.bufferRange.minimum = this.buffer_min.value;

        return this.config;
      },

      _setLayers: function() {
        var opLayers = this.map.itemInfo.itemData.operationalLayers;
        var options = [];

        var nOptLayers = opLayers.length;
        for (var i = nOptLayers - 1; i >= 0; i--) {
          if (opLayers[i].layerType === "ArcGISFeatureLayer") {
            options.push({
              label: opLayers[i].title,
              value: opLayers[i].title
            });
          }
        }

        if (options.length === 0) {
          domStyle.set(this.btnAddTab, "display", "none");
          new Message({
            message: this.nls.missingLayerInWebMap
          });
          return;
        }

        this.layer_options = lang.clone(options);
      },

      _setTypes: function() {
        this.analysis_options = [{
          value: 'closest',
          label: this.nls.closest
        }, {
          value: 'proximity',
          label: this.nls.proximity
        }, {
          value: 'summary',
          label: this.nls.summary
        }];
      },

      _populateTabTableRow: function(tabInfo) {
        var result = this.tabTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addTabLayers(tr);
          this._addTabTypes(tr);
          this._addTabLabel(tr);
          tr.selectLayers.set("value", tabInfo.layers);
          tr.selectTypes.set("value", tabInfo.type);
          tr.labelText.set("value", tabInfo.label);
        }
      },

      _addTabRow: function() {
        var result = this.tabTable.addRow({});
        if (result.success && result.tr) {
          var tr = result.tr;
          this._addTabLayers(tr);
          this._addTabTypes(tr);
          this._addTabLabel(tr);
        }
      },

      _addTabLayers: function(tr) {
        var lyrOptions = lang.clone(this.layer_options);
        var td = query('.simple-table-cell', tr)[0];
        if (td) {
          html.setStyle(td, "verticalAlign", "middle");
          var tabLayers = new Select({
            style: {
              width: "100%",
              height: "30px"
            },
            options: lyrOptions
          });
          tabLayers.placeAt(td);
          tabLayers.startup();
          tr.selectLayers = tabLayers;
        }
      },

      _addTabTypes: function(tr) {
        var typeOptions = lang.clone(this.analysis_options);
        var td = query('.simple-table-cell', tr)[1];
        if (td) {
          html.setStyle(td, "verticalAlign", "middle");
          var tabTypes = new Select({
            style: {
              width: "100%",
              height: "30px"
            },
            options: typeOptions
          });
          tabTypes.placeAt(td);
          tabTypes.startup();
          tr.selectTypes = tabTypes;
        }
      },

      _addTabLabel: function(tr) {
        var td = query('.simple-table-cell', tr)[2];
        html.setStyle(td, "verticalAlign", "middle");
        var labelTextBox = new ValidationTextBox({
          style: {
            width: "100%",
            height: "30px"
          }
        });
        labelTextBox.placeAt(td);
        labelTextBox.startup();
        tr.labelText = labelTextBox;
      },

      _onBtnSelectLayersClicked: function() {
        var args = {
          nls: this.nls,
          map: this.map,
          config: this.config,
          weatherTabAdditionalLayers: this.weatherTabAdditionalLayers,
          appConfig: this.appConfig
        };

        var sourceDijit = new FeaturelayerSource(args);

        var popup = new Popup({
          width: 830,
          height: 560,
          content: sourceDijit,
          titleLabel: this.nls.selectLayers
        });

        this.own(on(sourceDijit, 'ok', lang.hitch(this, function(items) {
          this.weatherTabAdditionalLayers = items;
          this.currentlySelectedLayer.innerHTML = this.weatherTabAdditionalLayers;
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();

        })));

        this.own(on(sourceDijit, 'cancel', lang.hitch(this, function() {
          sourceDijit.destroy();
          sourceDijit = null;
          popup.close();
        })));
      }

    });
  });
