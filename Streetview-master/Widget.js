define(['dojo/_base/declare',
  'jimu/BaseWidget',
      'esri/map'

],
function(declare, BaseWidget, map) {
    var clazz = declare([BaseWidget], {
        templateString: '<div> <br /> <br />1. Click the Streetview button to activate. <br /> 2. Click on the map, and Google Streetview will open for this location in a new window.  <br /> <br /> <br /> ' +
      '<input type="button" class="jimu-btn" id="btnPict" value="Streetview Clicker" data-dojo-attach-event="click:_streetviewClick"> <br /> <br /> <br /></div> ',
        _streetviewClick: function () {
            map = this.map;

            var handlerStreetView;
            //handlers 
            if (handlerStreetView) {
                handlerStreetView.remove();
                handlerStreetView= null;
            } else {



map.setMapCursor("url(widgets/Streetview/images/streetview.cur),auto");
                handlerStreetView = map.on("click", function (evt) {

                    pt = esri.geometry.webMercatorToGeographic(evt.mapPoint);
                    url = "http://maps.google.com/maps?q=Your+Sign+Location+in+Street+View@" + pt.x + "," + pt.y + "&cbll=" + pt.y + "," + pt.x + "&layer=c";
             

                    window.open(url);

                    ///// remove after one click
                    map.setMapCursor("default");
                    ////remove after one click
                    

                    handlerStreetView.remove();
                });
            };  /// end else for handlerStreetView 


            /////  end of street view widget

            /////
        }
});

clazz.hasStyle = false;
clazz.hasUIFile = false;
clazz.hasLocale = false;
clazz.hasConfig = false;
return clazz;
});

