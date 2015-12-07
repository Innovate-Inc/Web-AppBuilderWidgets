///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
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
/**
 * Stream widget panel.
 * @module widgets/Stream/setting/SingleFilter
 */
define(['dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/json',
  'dojo/on',
  'dojo/Evented',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dojo/text!./SingleFilter.html',
  'jimu/dijit/Filter',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/LoadingShelter',
  'dijit/form/ValidationTextBox'
],
function(declare, lang, JSON, on, Evented, _WidgetBase, _TemplatedMixin,
  _WidgetsInTemplateMixin, template, Filter) {
  return /**@alias module:widgets/Stream/setting/SingleFilter */ declare([_WidgetBase,
    _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: 'jimu-widget-stream-filter',
    templateString: template,
    streamLayer: null,
    config: null,

    postCreate: function() {
      this.inherited(arguments);

      this._init();
    },

    _init: function(){
      var layerDefinition;

      if(this.config){
        this.filterNameEditor.set('value', this.config.name);
      }

      this.own(on(this.filterNameEditor, 'change', lang.hitch(this, function(newValue){
        this.emit('filterNameChanged', newValue);
      })));

      //create filter area
      this.filter = new Filter({
        enableAskForValues: true,
        noFilterTip: this.nls.noFilterTip,
        style: "width:100%;margin-top:22px;"
      });
      this.filter.placeAt(this.singleFilterContent);

      if(this.streamLayer && this.config){
        this.shelter.show();
        layerDefinition = JSON.parse(this.streamLayer._json);
        if(this.config.filterInfo && typeof this.config.filterInfo === 'object'){
          this.filter.buildByFilterObj(this.streamLayer.url,
              this.config.filterInfo, layerDefinition).then(lang.hitch(this, function(){
            this.shelter.hide();
          }));
        }else{
          this.filter.buildByExpr(this.streamLayer.url, '1=1',
              layerDefinition).then(lang.hitch(this, function(){
            this.shelter.hide();
          }));
        }
      }
    },

    getConfig: function(){
      return {
        name: this.filterNameEditor.get('value'),
        filterInfo: this.filter.toJson()
      };
    }
  });
});
