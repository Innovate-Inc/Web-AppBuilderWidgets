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
/**
 * Single Analysis tool setting section.
 * @module widgets/Analysis/setting/SingleToolSetting
 */
define(['dojo/_base/declare',
  'dojo/text!./SingleToolSetting.html',
  'dojo/dom-style',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/ValidationTextBox',
  'jimu/dijit/CheckBox'
  ], function(declare, template, domStyle, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin){
  return /** @alias module: widgets/Analysis/setting/SingleToolSetting*/ declare([_WidgetBase,
      _TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-analysis-singleToolSetting',
    templateString: template,

    toolLabel: null,
    nls: null,
    /**
     * Analysis tool config. Include these options:
     * {
     *   toolLabel: '',
     *   showHelp: true,
     *   showChooseExtent: true,
     *   showCredits: true,
     *   returnFeatureCollection: true //If tool is Extract Data, this option will be removed.
     * }
     * @type {[type]}
     */
    config: null,
    /**
     * Analysis tool settings. Include dijitID, analysisLayer, etc.
     * @type {object}
     */
    rowData: null,

    postCreate: function(){
      this.inherited(arguments);

      this.labelEditor.set('value', this.toolLabel);

      if(this.rowData.title === 'extractData'){
        domStyle.set(this.resultOption, 'display', 'none');
      }
    },

    getConfig: function(){
      var ret = {
        showHelp: this.helptipChk.getValue(),
        showCredits: this.creditsChk.getValue(),
        showChooseExtent: this.mapExtentChk.getValue(),
        showReadyToUseLayers: this.readyToUseLayersChk.getValue()
      };

      if(this.rowData.title !== 'extractData'){
        ret.returnFeatureCollection = !this.resultChk.getValue();
      }

      if(this.labelEditor.validate()){
        ret.toolLabel = this.labelEditor.get('value');
      }else{
        ret.toolLabel = this.toolLabel || 'undefined';
      }

      return ret;
    },

    setConfig: function(config){
      this.config = config;

      this.labelEditor.set('value', config.toolLabel);
      this.helptipChk.setValue(config.showHelp);
      this.creditsChk.setValue(config.showCredits);
      this.mapExtentChk.setValue(config.showChooseExtent);
      this.readyToUseLayersChk.setValue(config.showReadyToUseLayers);

      if('returnFeatureCollection' in config){
        this.resultChk.setValue(!config.returnFeatureCollection);
      }
    }
  });
});
