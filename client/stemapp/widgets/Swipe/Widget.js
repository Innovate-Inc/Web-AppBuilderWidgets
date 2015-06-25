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
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',
    'dojo/query',
    'dojo/dom-style',
    'dojo/_base/array',
    'dojo/store/Memory',
    'dojo/dom-construct',

    'dijit/form/ToggleButton',

    'dojox/widget/Toaster',

    'esri/arcgis/utils',

    'jimu/BaseWidget',
    'jimu/LayerInfos/LayerInfos',

    'dijit/form/Select',
    'dijit/_WidgetsInTemplateMixin',

    './js/LayerSwipe'
],
    function(declare, lang, on, dom, query, domStyle, array, Memory, domConstruct,
             ToggleButton,
             Toaster,
             arcgisUtils, 
             BaseWidget, LayerInfos, 
             Select, _WidgetsInTemplateMixin, 
             LayerSwipe) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            name: 'Swipe',
            baseClass: "jimu-widget-swipe",
            swipeWidget: null,
            swipeButton: null,
            postCreate: function() {
                this.inherited(arguments);
                //Populate the tool list
                this.activeTool.addOption(this.getToolStore());
                //Init listener on tool change
                this.own(on(this.activeTool, "change", lang.hitch(this, this.onToolChange)));
                //Init the toggle button
                this.swipeButton = new ToggleButton({
                    showLabel: true,
                    checked: false,
                    onChange: lang.hitch(this, this.onInitSwipeChange),
                    label: "Enable Swipe"
                }, this.initSwipe);
                //Set global parameter to false
                window.isSwipeEnabled = false;
            },

            onToolChange: function(value) {
                if (this.swipeWidget) {
                    if (this.activeTool.attr('value') == "vertical")
                        this.swipeWidget.set("type", "vertical");
                    else if (this.activeTool.attr('value') == "horizontal")
                        this.swipeWidget.set("type", "horizontal");
                    else
                        this.swipeWidget.set("type", "scope");
                }
            },

            onInitSwipeChange: function(value) {
                window.isSwipeEnabled = value;
                if (value === true) {
                    this.initSwipeWidget();  
                    this.swipeButton.set('label', 'Disable Swipe');
                } else {
                    this.destroySwipeWidget();    
                    this.swipeButton.set('label', 'Enable Swipe');
                }                  
            },

            onOpen: function(evt) {
                //Remove old items from layer list
                if (this.layerSelect.getOptions().length > 0) {
                    this.layerSelect.removeOption(this.layerSelect.getOptions());
                }                
                //Populate the layer list
                this.layerSelect.addOption(this.getMapStore());
            },

            onClose: function(evt) {
                //Display message to user if swipe tool is still enabled
                if (typeof(window.isSwipeEnabled) !== 'undefined' && window.isSwipeEnabled === true) {
                    var info = new Toaster({
                        messageTopic: 'swipeMessage',
                        positionDirection: 'tr-down',
                        duration: 5000                        
                    });
                    window.setTimeout(lang.hitch(this, function() {
                        dojo.publish('swipeMessage', [{message: "Swipe Widget is still functional. Open widget to disable swipe function", 
                            type: 'message'}]);
                    }));
                }
            },

            createLayerSwipeDiv: function() {
                var layerSwipeDiv = query("#LayerSwipe");
                if (layerSwipeDiv.length == 0) {
                    var mapDom = dom.byId(this.map.id);
                    var layerSwipeDiv = domConstruct.create("div", {id: "LayerSwipe"}, this.map.id, "first");
                }
            },

            getToolStore: function() {
                var toolOptions = [
                    {label: "Vertical Swipe", value: "vertical"},
                    {label: "Horizontal Swipe", value: "horizontal"},
                    {label: "Scope", value: "scope"}
                ];
                return toolOptions;
            },

            getMapStore: function() {
                var mapStore = [];
                LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function(operLayerInfos) {
                    array.forEach(operLayerInfos.layerInfos, lang.hitch(this, function(layerInfo) {
                        if (layerInfo.newSubLayers.length === 0) {
                            var obj = {
                                label: layerInfo.title,
                                value: layerInfo.id
                            };
                            mapStore.push(obj);
                        }
                    }))//foreach
                }));
                return mapStore;
            },

            destroySwipeWidget: function() {
                if (this.swipeWidget) {
                    this.swipeWidget.destroy();
                    this.swipeWidget = null;
                }
            },

            initSwipeWidget: function(val) {
                var selectedLayerId = null;
                if (val) {
                    selectedLayerId = val;
                } else {
                    selectedLayerId = this.layerSelect.get("value");
                }
                this.createLayerSwipeDiv();
                var displayedValue = this.layerSelect.get("displayedValue");
                if (selectedLayerId && displayedValue) {
                    var layerSwipeDiv = query("#LayerSwipe");
                    var layer = this.map.getLayer(selectedLayerId);
                    if ((layer) && (layerSwipeDiv.length == 1)) {
                        if (layer.visible) {
                            layer.setVisibility(true);
                        }

                        this.swipeWidget = new LayerSwipe({
                            type: this.activeTool.attr('value'),
                            map: this.map,
                            layers: [layer]
                        }, layerSwipeDiv[0].id);
                        this.swipeWidget.startup();
                    }
                }
            }
        });
    });