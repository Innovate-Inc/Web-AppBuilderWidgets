
define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'dijit/form/NumberTextBox',
    'dijit/form/CheckBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      //these two properties is defined in the BaseWidget
      baseClass: 'jimu-widget-StreetViewer-setting',

      startup: function() {
          this.inherited(arguments);

        this.setConfig(this.config);
      },

      setConfig: function (config) {

          //get settings from the config.json file
          this.config = config;
          if (config.mapFrame) {
              this.mapFrame.set('checked', true);
          } else { this.mapFrame.set('checked', false); }
          if (config.svFrame) {
              this.svFrame.set('checked', true);
          } else { this.svFrame.set('checked', false); }
          if (config.beFrame) {
              this.beFrame.set('checked', true);
          } else { this.beFrame.set('checked', false); }
          if (config.infoFrame) {
              this.infoFrame.set('checked', true);
          } else { this.infoFrame.set('checked', false); }
 
      },

      getConfig: function () {
         
          //set the values in the config.json file based on the values in the checkboxes
          this.config.mapFrame = this.mapFrame.checked;
          this.config.svFrame = this.svFrame.checked;
          this.config.beFrame = this.beFrame.checked;
          //this.config.infoFrame = this.infoFrame.checked;
          
        return this.config;
      }

    });
  });