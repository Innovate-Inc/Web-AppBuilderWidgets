
define([
    "dojo/_base/declare",
  "jimu/BaseWidget",
  "dijit/form/ToggleButton",
  "dojo/dom",
  "dijit/registry",
  "dijit/form/Button",
  "dojo/on",
  "dojo/aspect",
  "esri/map"
   

],
function (declare, BaseWidget, ToggleButton, dom, registry, Button, on, aspect, map) {
    var handlerPictometry = {advice: null};

    var clazz = declare([BaseWidget], 


{
        templateString: '<div> <br /> <br />1. Click the Pictometry button to activate. <br /> 2. Click on the map, and Pictometry Viewer will display imagery for this location in a new window.  <br /> <br /> <br /> ' +
      '<input type="button" class="jimu-btn" id="btnPict" value="Pictometry Clicker" data-dojo-attach-event="click:_pictometryClick"> <br /> <br /> <br /></div> ',
     
 baseClass: 'jimu-widget-pictometry',
 name: 'Pictometry',

        _pictometryClick: function () {


            pictometryCloudURL = this.config.configText;
            map = this.map;
         
            //handlers 
            if (!handlerPictometry.advice) {

                //map.setMapCursor("crosshair");
                                map.setMapCursor("url(widgets/Pictometry/images/pictometryCursor.cur),auto");

                handlerPictometry = map.on("click", function (evt) {

                    var pt = esri.geometry.webMercatorToGeographic(evt.mapPoint);
                    var url = pictometryCloudURL + 'lat=' + pt.y + '&lon=' + pt.x;

                    //alert(url);
                    window.open(url);

                    ///// remove after one click
                    //     handlerPictometry.remove();
                    map.setMapCursor("default");
                    Pict = false;
                    ////remove after one click


                    handlerPictometry.remove();
                    handlerPictometry.advice = null; //hm, should we disable after one click and re-wire other handlers? Revisit later..
                });

            };  /// end else for handlerPictometry


            /////  end of pictometry widget

            /////
        },

        startup: function () {
            this.inherited(arguments);
            //alert('startup');

          //  alert(this.config.configText);


        },

        onClose:
    function () {
        this.inherited(arguments);
        map = this.map;
        map.setMapCursor("default");

        handlerPictometry.remove();
        handlerPictometry.advice = null;
    }


    });

    clazz.hasStyle = true;
    clazz.hasUIFile = false;
    clazz.hasLocale = false;
    clazz.hasConfig = true;
    return clazz;
});