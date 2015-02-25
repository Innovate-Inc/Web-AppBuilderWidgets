define(['dojo/_base/declare', 'jimu/BaseWidget', 'esri/tasks/GeometryService', 'esri/tasks/ProjectParameters', 'esri/SpatialReference',
        'esri/graphic', 'esri/symbols/SimpleMarkerSymbol', 'dojo/query', 'dojo/NodeList-traverse'],
function(declare, BaseWidget, GeometryService, ProjectParameters, SpatialReference,
         Graphic, SimpleMarkerSymbol, query) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    // DemoWidget code goes here 
    
    //please note that this property is be set by the framework when widget is loaded.
    //templateString: template,

    baseClass: 'jimu-widget-demo',

    name: 'StreetViewer',

    postCreate: function () {
      //this.inherited(arguments);
      console.log('postCreate');
    },

    startup: function () {
        
        this.inherited(arguments);
        
        //this.map.setMapCursor("url(./widgets/Demo/images/gsv.cur), auto");
        //this.map.setMapCursor("pointer");
        //this.mapIdNode.innerHTML = 'map id:' + this.map.id;
      geoService = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
     
      console.log('startup');
    },
  
    onOpen: function () {
        //alert(this.parentNode);
        
        //alert(this.id);
        this.map.setMapCursor("pointer");
        config = this.config;
        //wire up map on click event
        mapClick = this.map.on("click", myClick);
        //fired when user clicks on map
        function myClick(evt) {
            this.graphics.clear();
            
            var x, y, point, pPoint;
            var outSR = new SpatialReference(4326);
            point = evt.mapPoint;
            //alert(point.x);

            var symbol = new SimpleMarkerSymbol().setStyle("diamond");
            symbol.setColor("yellow");
            symbol.setSize("20");

            var gclick = new Graphic(point, symbol);
            //this.mapIdNode.graphics.Add(gclick);
            this.graphics.add(gclick);

            var geoPoint = esri.geometry.webMercatorToGeographic(evt.mapPoint);
            //alert(geoPoint.x);
            
            //get set up from config file
            var m = "", s = "", b = "", i = "";
            if (config.mapFrame) {
                m = "m";
            }
            if (config.svFrame) {
                s = "s";
            }
            if (config.beFrame) {
                b = "b";
            }
            if (config.infoFrame) {
                i = "i";
            }
            var frames = m + s + b + i;
            
            var dMap = document.getElementById('dualMap');
            //http://data.mapchannels.com/dualmaps5/map.htm?lat=37.789536&lng=-122.388581&z=21&slat=37.789524&slng=-122.388604&sh=79.12&sp=-17.66&sz=0.66&panel=mbs&gm=0&bm=2&mw=1&be=1&mv=1&md=0&mi=1
            var path = "http://data.mapchannels.com/dualmaps5/map.htm?lat=" + geoPoint.y + "&lng=" + geoPoint.x;
            dMap.innerHTML = '<iframe id="dMaps" style="width:100%;height:100%; padding:0px" src="' + path +' &panel='+ frames +'" marginwidth="0" marginheight="0" frameborder="0" scrolling="no"></iframe>';
            //document.getElementById('dMaps').setAttribute("src", path);
            dMap.style.visibility = 'visible';
            
            return point;
        }
      console.log('onOpen');
    },

    onClose: function () {
        this.map.setMapCursor("default");
        this.map.graphics.clear();
        mapClick.remove();
        //alert("no click");
      console.log('onClose');
    },

    onMinimize: function(){
      console.log('onMinimize');
    },

    onMaximize: function(){
      console.log('onMaximize');
    },

    onSignIn: function(credential){
      /* jshint unused:false*/
      console.log('onSignIn');
    },

    onSignOut: function(){
      console.log('onSignOut');
    }
  });
});