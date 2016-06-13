define(['dojo/_base/declare', 
    'jimu/BaseWidget',
    //'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js',
    'jimu/loaderplugins/jquery-loader!widgets/AddDemographicLayers/jquery.min.js',
    "dijit/_Widget",
    'dijit/_WidgetsInTemplateMixin',
  "dijit/_Templated",
  'dojo/_base/lang',
  'dojo/on',
  'dojo/_base/Color',
    'dijit/form/Slider',
 'esri/tasks/GenerateRendererTask',
'esri/dijit/Legend',
'esri/tasks/query',
'esri/layers/ArcGISDynamicMapServiceLayer',
'esri/layers/ImageParameters',
'dijit/form/HorizontalSlider',

"./configLocal",
'jimu/dijit/ColorPicker'],
function(declare, 
    BaseWidget,
    $,
    _Widget,
    _WidgetsInTemplateMixin,
    _Templated,
    lang,
    on,
    Color,
    Slider,
  GenerateRendererTask,
  esriLegend,
  esriquery,
  ArcGISDynamicMapServiceLayer,
  ImageParameters,
  HorizontalSlider,
  _config,
  ColorPicker) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget,_WidgetsInTemplateMixin], {
    // Custom widget code goes here 
	
    baseClass: 'jimu-widget-AddDemographics',
    
    //this property is set by the framework when widget is loaded.
     name: 'AddDemographics',
     
     /*colorThemes:
     [{"startcolor": "#eaf0fd", "endcolor": "#03519e"},
      {"startcolor":"#ebf9e7", "endcolor": "#046e2e"},
      {"startcolor":"#f5f5f5", "endcolor": "#2a2a2a"},
      {"startcolor":"#ffeddd", "endcolor": "#a83a00"},
      {"startcolor":"#f2eef6", "endcolor": "#582890"},
      {"startcolor":"#ffe3d7", "endcolor": "#a71713"},
      {"startcolor":"#ecf7fb", "endcolor": "#006d2a"},
      {"startcolor":"#edf8fa", "endcolor": "#83067e"},
      {"startcolor":"#eef9e8", "endcolor": "#0167af"},
      {"startcolor":"#fff1d7", "endcolor": "#b80201"},
      {"startcolor":"#f0eef6", "endcolor": "#015b90"},
      {"startcolor":"#f5eff7", "endcolor": "#006dfa"},
      {"startcolor":"#f1eef7", "endcolor": "#9c0042"},
      {"startcolor":"#ffebe2", "endcolor": "#7d0078"},
      {"startcolor":"#ffffc9", "endcolor": "#016a35"},
      {"startcolor":"#ffffcb", "endcolor": "#253197"},
      {"startcolor":"#fffed1", "endcolor": "#9e3601"},
      {"startcolor":"#ffffad", "endcolor": "#c20120"},
      {"startcolor":"#a9620d", "endcolor": "#038772"},
      {"startcolor":"#d3168c", "endcolor": "#46ae1b"},
      {"startcolor":"#7c2d96", "endcolor": "#048936"},
      {"startcolor":"#eb6300", "endcolor": "#603b9b"},
      {"startcolor":"#cc0117", "endcolor": "#0471b2"},
      {"startcolor":"#ce0118", "endcolor": "#424242"},
      {"startcolor":"#db1a10", "endcolor": "#287cba"},
      {"startcolor":"#da1baf", "endcolor": "#03983e"},
      {"startcolor":"#db1a10", "endcolor": "#2483bb"}
    ],*/
colorThemes:
        [{ "startcolor": "#ffffb2", "endcolor": "#ff0000" }
        , { "startcolor": "#eaf0fd", "endcolor": "#03519e" }
        , { "startcolor": "#ffccff", "endcolor": "#660066" }
         , { "startcolor": "#D0CFEE", "endcolor": "#322C75" }
       , { "startcolor": "#fef0d9", "endcolor": "#b30000" }
       , { "startcolor": "#FFFFD1", "endcolor": "#B0B080" }
        , { "startcolor": "#f2f0f7", "endcolor": "#54278f" }
        , { "startcolor": "#eff3ff", "endcolor": "#08519c" }
        , { "startcolor": "#f7f7f7", "endcolor": "#252525" }
        , { "startcolor": "#ccffff", "endcolor": "#006666" }
        , { "startcolor": "#ffffcc", "endcolor": "#006837" }
        , { "startcolor": "#ccccff", "endcolor": "#000066" }
        ],
//methods to communication with app container:

   startup: function () {
        
        this.catType = "";
        this.dfield = "";
        this._serviceWidgets = [];
        this.currentk = 0;
        this.reverseStatus = false;
        this.dtype = "ejdemog";
        this.inherited(arguments);
      

    },
    postCreate: function () {
        this._zoomHandler = on(this.map, "zoom-end", lang.hitch(this,this._adjustToState));
        
        var currenttype = "ejdemog";
        this.classNumNode.value = "5";
        this.bWidthNode.value = "1";
        this.currentk = 0;
        this.createCategory(currenttype);
        this.drawPalette(this.classNumNode.value, this.currentk, this.reverseStatus);

    },
    _adjustToState: function () {
        var wobj = this;
        dojo.forEach(this._serviceWidgets, function (a) {
            var tobj = a;
            var mid = tobj.mid;
            var lid = tobj.fid;
            var layeruniqueid = mid + lid + "_map";
            
            var orgactivelayer = tobj.actlayer;

            var activelayer = wobj.getActiveLayer(mid, lid);
            //console.log("active layer: " + orgactivelayer + "; current layer: " + activelayer);
            if (orgactivelayer != activelayer) {
                /*if (dmlayer != null) {
                    dmlayer.hide();
                }*/
                var alyrindex = _config.demogJSON[mid].baselayers[activelayer].layeridx;

                wobj.classbreak(tobj);
                

            }
        });
    },
    
    createCategory: function (key) {
        this.catType = "";
        this.demogTypeNode.options.length = 0;
        this.demogListNode.options.length = 0;
        var wobj = this;
        wobj.dtype = key;
        var dgObj = _config.demogJSON[key];
        this.descdiv.innerHTML = dgObj.description;       

        if (dgObj.process) {
            wobj.createCatList(key);
            wobj.setDefaultListIndex(dgObj.defaultCategoryIndex);           

        } else {
            var lookuptableurl = dgObj.layerurl + dgObj.service + "/MapServer/" + dgObj.lookupindex;
            //alert(lookuptableurl);
            var queryTask = new esri.tasks.QueryTask(lookuptableurl);
            var query = new esriquery();

            query.returnGeometry = false;

            query.outFields = ["*"];
            var dirty = (new Date()).getTime();
            query.where = "1=1 AND " + dirty + "=" + dirty;

            //get features in order by cat and label
            query.orderByFields = ["CATEGORY", "DESCRIPTION"];

            var operation = queryTask.execute(query);
            operation.addCallbacks(function (featset) {
                if (featset.features.length > 0) {
                    var fetcount = featset.features.length;
                    var catJson = {};
                    var layerJson = {};
                    var tableJson = {};
                    for (var m = 0; m < fetcount; m++) {
                        if (key == "acs2012") {
                            var cat = dojo.trim(featset.features[m].attributes["CATEGORY"]);
                            var colname = dojo.trim(featset.features[m].attributes["FIELD_ID"]);
                            var tablename = dojo.trim(featset.features[m].attributes["TABLE_NAME"]);
                            var tabledesc = dojo.trim(featset.features[m].attributes["TABLE_DESC"]);
                            var desc = dojo.trim(featset.features[m].attributes["DESCRIPTION"]);
                            var lindex = featset.features[m].attributes["LAYER_INDEX"];
                            var bgmin = featset.features[m].attributes["BG_MIN"];
                            var bgmax = featset.features[m].attributes["BG_MAX"];

                            layerJson[colname] = {};
                            layerJson[colname].description = desc;
                            layerJson[colname].layerindex = lindex;
                            layerJson[colname].bg_min = bgmin;
                            layerJson[colname].bg_max = bgmax;



                            if (typeof catJson[tablename] == 'undefined') {
                                catJson[tablename] = [];
                                tableJson[tablename] = tabledesc;
                            }
                            catJson[tablename].push(colname);
                        } else {
                            var cat = dojo.trim(featset.features[m].attributes["CATEGORY"]);
                            var colname = dojo.trim(featset.features[m].attributes["FIELD_NAME"]);
                            var desc = dojo.trim(featset.features[m].attributes["DESCRIPTION"]);

                            var bgmin = featset.features[m].attributes["BG_MIN"];
                            var bgmax = featset.features[m].attributes["BG_MAX"];
                            var trmin = featset.features[m].attributes["TR_MIN"];
                            var trmax = featset.features[m].attributes["TR_MAX"];
                            var cntymin = featset.features[m].attributes["CNTY_MIN"];
                            var cntymax = featset.features[m].attributes["CNTY_MAX"];
                            var stmin = featset.features[m].attributes["ST_MIN"];
                            var stmax = featset.features[m].attributes["ST_MAX"];
                            layerJson[colname] = {};
                            layerJson[colname].description = desc;
                            layerJson[colname].bg_min = bgmin;
                            layerJson[colname].bg_max = bgmax;
                            layerJson[colname].tr_min = trmin;
                            layerJson[colname].tr_max = trmax;
                            layerJson[colname].cnty_min = cntymin;
                            layerJson[colname].cnty_max = cntymax;
                            layerJson[colname].st_min = stmin;
                            layerJson[colname].st_max = stmax;

                            if (typeof featset.features[m].attributes["BLK_MIN"] != 'undefined') {
                                var blkmin = featset.features[m].attributes["BLK_MIN"];
                                var blkmax = featset.features[m].attributes["BLK_MAX"];
                                layerJson[colname].blk_min = blkmin;
                                layerJson[colname].blk_max = blkmax;
                                //alert("Block: " + blkmin + ": " + blkmax);
                            }

                            if (typeof catJson[cat] == 'undefined') {
                                catJson[cat] = [];

                            }
                            catJson[cat].push(colname);
                        }

                    }

                    _config.demogJSON[key].category = catJson;
                    if (key == "acs2012") _config.demogJSON[key].tables = tableJson;
                    _config.demogJSON[key].dynamiclayers = layerJson;
                    dgObj.process = true;
                    wobj.createCatList(key);
                    //wobj.setDefaultListIndex(dgObj.defaultCategoryIndex); 

                }

            }, function (error) {
                console.log(error);
            });
        }
    },
    setDefaultListIndex: function (defaultIndex) {
        //set default demog category to Population and update sublist, default for each group set in config object
        this.demogTypeNode.selectedIndex = defaultIndex;
        this._changeDemog();
    },
    createCatList: function (key) {
        //console.log("create cat list");
        this.demogTypeNode.options.length = 0;
        var n = 0;
        if (key == "acs2012") {
            for (var c in _config.demogJSON[key].tables) {
                //alert(c + ": " + demogJSON[key].category[c]);
                var option = new Option(_config.demogJSON[key].tables[c], c);
                if (c == this.catType) option.selected = true;
                this.demogTypeNode.options[n] = option;
                n = n + 1;
            }
        } else {
            for (var c in _config.demogJSON[key].category) {
                //alert(c + ": " + demogJSON[key].category[c]);
                var option = new Option(c, c);
                if (c == this.catType) option.selected = true;
                this.demogTypeNode.options[n] = option;
                n = n + 1;
            }
        }
        if (this.catType == "") this.catType = this.demogTypeNode.options[0].value;
        this.createColList(key);
    },
    createColList: function (key) {
        //console.log(" create col list");
        this.demogListNode.options.length = 0;
        var cat = this.catType;
        var fields = _config.demogJSON[key].category[cat];
        var m = 0;
        for (var i = 0; i < fields.length; i++) {
            var fieldname = fields[i];
            var fielddesc = _config.demogJSON[key].dynamiclayers[fieldname].description;
            var option = new Option(fielddesc, fieldname);
            if (fieldname == this.dfield) option.selected = true;
            this.demogListNode.options[m] = option;
            m = m + 1;

        }
        var fkey = this.demogListNode.value;
        this.dfield = fkey;
        var robj = _config.demogJSON[key].dynamiclayers[fkey];
        robj.method = this.classTypeNode.value;
        robj.classes = this.classNumNode.value;
        this.renderobj = robj;
        

    },
    
    _reverseColor: function () {
        if (this.reverseStatus) this.reverseStatus = false;
        else this.reverseStatus = true;
        this.drawPalette(this.classNumNode.value, this.currentk, this.reverseStatus);
    },
    _changeCat: function () {
        this.drawPalette(this.classNumNode.value, this.currentk, this.reverseStatus);
    },
    _changeService: function () {
        var theme = this.serviceNode.value;

        this.createCategory(theme);
    },
    _changeDemog: function () {
        //console.log("change demog");
        this.currentk = 0;
        var currentcat = this.demogTypeNode.value;
        this.catType = currentcat;
        var dmtype = this.dtype;
        this.createColList(dmtype);
    },
    _changeField: function () {
        this.currentk = 0;
        this.dfield = this.demogListNode.value;
        var robj = _config.demogJSON[this.dtype].dynamiclayers[this.dfield];

        robj.method = this.classTypeNode.value;
        robj.classes = this.classNumNode.value;
        this.renderobj = robj;
        //this.drawPalette(robj.classes, this.currentk, this.reverseStatus);
    },
    
    _mapDemog: function (e) {
        this.addspining(e);
        var frm = this.renderform;
        var fcolor = frm.startcolor.value;
        var ecolor = frm.endcolor.value;
        var mapid = this.dtype;
        var fieldid = this.demogListNode.value;
        var dmethod = this.classTypeNode.value;
        var dclass = this.classNumNode.value;
        var robj = _config.demogJSON[this.dtype].dynamiclayers[fieldid];

        robj.method = dmethod;
        robj.classes = dclass;
        robj.fromcolor = fcolor;
        robj.tocolor = ecolor;

        robj.mid = mapid;
        robj.fid = fieldid;
        this.classbreak(robj);
    },
    classbreak: function (renderobj) {
        var wobj = this;
        var fieldobj = this.demogListNode;
        var fielddesc = fieldobj.options[fieldobj.selectedIndex ].text;
        var svcobj = this.serviceNode;
        var svcdesc = svcobj.options[svcobj.selectedIndex ].text;
        var opcvalue = 1 - this.demogsliderNode.value;
        var mapid = renderobj.mid;
        var fieldid = renderobj.fid;
        var activelayer = this.getActiveLayer(mapid, fieldid);
        var descstr = _config.demogJSON[mapid].baselayers[activelayer].level;
        this.levelDiv.innerHTML = descstr;
        renderobj.actlayer = activelayer;

        var linewidth = parseInt(this.bWidthNode.value);
        var linecolor = this.color1.getColor();
        //alert(linecolor);
        var classDef = new esri.tasks.ClassBreaksDefinition();
        classDef.classificationField = fieldid;
        classDef.classificationMethod = renderobj.method; // always natural breaks
        classDef.breakCount = renderobj.classes; // always five classes

        var colorRamp = new esri.tasks.AlgorithmicColorRamp();
        colorRamp.fromColor = new dojo.colorFromHex(renderobj.fromcolor);
        colorRamp.toColor = new dojo.colorFromHex(renderobj.tocolor);
        colorRamp.algorithm = "hsv"; // options are:  "cie-lab", "hsv", "lab-lch"
        var linesym = new esri.symbol.SimpleLineSymbol(
              esri.symbol.SimpleLineSymbol.STYLE_SOLID,
              new dojo.Color(linecolor)
            );
        if (linewidth > 0) linesym.setWidth(linewidth);
        else linesym = null;
        var bsymbol = new esri.symbol.SimpleFillSymbol(
            esri.symbol.SimpleFillSymbol.STYLE_SOLID,
           linesym,
            null
          );
        classDef.baseSymbol = bsymbol;
        var outlinesym = new esri.symbol.SimpleLineSymbol().setWidth(0.5);
        classDef.colorRamp = colorRamp;
        var minfield = activelayer + "_min";
        var maxfield = activelayer + "_max";
        var layerminvalue = null;
        var layermaxvalue = null;
        if (_config.demogJSON[mapid].dynamiclayers[fieldid][minfield]) layerminvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][minfield];
        if (_config.demogJSON[mapid].dynamiclayers[fieldid][maxfield]) layermaxvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][maxfield];

        if ((layerminvalue == null) && (layermaxvalue == null)) {
            if (activelayer == "blk") {
                activelayer = "bg";
            } else if (activelayer == "bg") {
                activelayer = "tr";
            } else if (activelayer == "tr") {
                activelayer = "cnty";
            }
            var minfield = activelayer + "_min";
            var maxfield = activelayer + "_max";
            layerminvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][minfield];
            layermaxvalue = _config.demogJSON[mapid].dynamiclayers[fieldid][maxfield];
            renderobj.actlayer = activelayer;
        }
        //this.levelDiv.innerHTML = _config.demogJSON[mapid].baselayers[activelayer].level;
        var params = new esri.tasks.GenerateRendererParameters();
        params.classificationDefinition = classDef;
        var dataUrl = _config.demogJSON[mapid].layerurl + _config.demogJSON[mapid].service + "/MapServer";
        var alyrindex = _config.demogJSON[mapid].baselayers[activelayer].layeridx;

        var generateRenderer = new esri.tasks.GenerateRendererTask(dataUrl + "/" + alyrindex);

        generateRenderer.execute(params, function (renderer) {
            renderer.infos[0].minValue = layerminvalue;
            renderer.infos[renderer.infos.length - 1].maxValue = layermaxvalue;
            var optionsArray = [];
            var drawingOptions = new esri.layers.LayerDrawingOptions();

            for (var m = 0; m < renderer.infos.length; m++) {
                //alert(renderer.infos[m].minValue + "; " + renderer.infos[m].maxValue);
                renderer.infos[m].label = Number(renderer.infos[m].minValue).toFixed(0) + " - " + Number(renderer.infos[m].maxValue).toFixed(0);
            }
            renderobj.renderer = renderer;
            drawingOptions.renderer = renderer;
            optionsArray[alyrindex] = drawingOptions;

            var layeridstr = mapid + fieldid + "_map";

            
            if (wobj.map.getLayer(layeridstr)) {
                var dmlayer = wobj.map.getLayer(layeridstr);
                wobj.map.removeLayer(dmlayer);
            } else {
                wobj._serviceWidgets.push(renderobj);
            }
           /* var imageParameters = new ImageParameters();
             imageParameters.layerIds = [alyrindex];
             imageParameters.layerOption = ImageParameters.LAYER_OPTION_SHOW;*/
            var dmlayer = new ArcGISDynamicMapServiceLayer(dataUrl, {
                "id": layeridstr,
                "opacity": opcvalue
            });
            dmlayer.name = svcdesc + " - " + fielddesc;
            dmlayer.isDynamic = true;
            dmlayer.renderField = fieldid;
            dmlayer.layerType = mapid + "_" + alyrindex;
            dmlayer.renderIndex = alyrindex;

            wobj.map.addLayer(dmlayer);
            
            dmlayer.on("update-start",lang.hitch(wobj,wobj.showloading,layeridstr));
            dmlayer.on("update-end",lang.hitch(wobj,wobj.hideloading,layeridstr));
            dmlayer.setVisibleLayers([alyrindex]);
            
            

            dmlayer.setLayerDrawingOptions(optionsArray);
            
            //dmlayer.setVisibleLayers([alyrindex]);
            
            if (renderobj.whereclause) {
                var layerdef = [];
                layerdef[alyrindex] = renderobj.whereclause;
                dmlayer.setLayerDefinitions(layerdef);
            }
                
                
         
        wobj.removespining();
        }, function (err) {
            console.log("error");
           
            wobj.removespining();
        });
    },
    
    showloading: function(key) {
        
        var loaddivid = "loadingdiv_" + key;
        var cx = (this.map.width / 2) - 50;
        var cy = this.map.height / 2;
        if (document.getElementById(loaddivid)) {
            document.getElementById(loaddivid).innerHTML = "Loading Demographics layer... Please wait.";
            document.getElementById(loaddivid).style.top = parseInt(cx) + "px";
            document.getElementById(loaddivid).style.left = parseInt(cy) + "px";
        } else {
            var dummy = document.createElement("div");
            dummy.id = loaddivid;
            dummy.style.position = "absolute";
            
            dummy.style.left = (cx) + "px";
            dummy.style.top = (cy) + "px";
            dummy.innerHTML = "Loading Demographics layer... Please wait.";
            dummy.style.display = "block";
            dummy.style.zIndex = "1000";
            dummy.style.backgroundColor = "#cccccc";
            dummy.style.fontSize = "14pt";
            dummy.style.color = "Red";
            document.body.appendChild(dummy);
            
        }
        //console.log("start update: " + key + "; cx: " + cx + ", cy: " + cy);
        this.map.disableMapNavigation();
        this.map.hideZoomSlider();
    },
    hideloading: function(key) {
        //console.log("end update: " + key);
        var loaddivid = "loadingdiv_" + key;
        if (document.getElementById(loaddivid)) {
            var dummy = document.getElementById(loaddivid);
            document.body.removeChild(dummy);
        }
        this.map.enableMapNavigation();
        this.map.showZoomSlider();
    },
    addspining: function(event) {
        var x;
        var y;

        if (event.x != undefined && event.y != undefined) {
            
            x = window.event.clientX;
            y = window.event.clientY;

        }
        else // Firefox method to get the position
        {
            x = event.clientX + document.body.scrollLeft +
                  document.documentElement.scrollLeft;
            y = event.clientY + document.body.scrollTop +
                  document.documentElement.scrollTop;
           
        }


        if (document.getElementById("spindiv")) {
            var dummy = document.getElementById("spindiv");
            dummy.style.position = "absolute";
            dummy.style.left = (x) + "px";
            dummy.style.top = (y) + "px";
            dummy.style.display = "block";
            
        } else {
            var dummy = document.createElement("div");
            dummy.id = "spindiv";
            dummy.style.position = "absolute";
            
            dummy.style.left = (x) + "px";
            dummy.style.top = (y) + "px";
            dummy.innerHTML = "<img src='" + this.folderUrl + "images/hourglas.gif' alt='loading...' />";
            dummy.style.display = "block";
            dummy.style.zIndex = "1000";
            document.body.appendChild(dummy);
        }
    },
    removespining: function() {
        if (document.getElementById("spindiv")) {
            var dummy = document.getElementById("spindiv");
            document.body.removeChild(dummy);
        }
    },
    getActiveLayer: function (mid, fldid) {
        var zlevel = this.map.getLevel();
        var actlayer = "bg";

        var blayers = _config.demogJSON[mid].baselayers;
        for (var b in blayers) {
            var minl = blayers[b].minlevel;
            var maxl = blayers[b].maxlevel;
            var lindex = blayers[b].layeridx;
            if ((zlevel < maxl) && (zlevel >= minl)) {
                actlayer = b;

            }
        }


        return actlayer;
    },
    
    ArrayContains: function (element, inArray) {
        for (var j = 0; j < inArray.length; j++) {
            if (element == inArray[j]) {
                return true;
            }
        }
        return false;
    },

tablePalette: function(count, scolor, ecolor) {
  
  var pctvalue = 100 / (count + 1);
  var divwidth = 12 * (count + 1);
  var c1 = new Color(scolor);
  var c2 = new Color(ecolor);
  var deltaR = Math.floor((c2.r - c1.r)/count);
  var deltaG = Math.floor((c2.g - c1.g)/count);
  var deltaB = Math.floor((c2.b - c1.b)/count);
  var colorcol = '';
    colorcol += '<table cellpadding="0" cellspacing="0" style="width: ' + divwidth + 'px; height: 12px;">';
    colorcol += '<tr>';
    colorcol += '<td width="' + pctvalue + '%" style="background-color: rgb(' + c1.r + "," + c1.g + "," + c1.b + ');"></td>'
  for(var i=1;i<count;i++){
    var r = c1.r + deltaR * i;
    var g = c1.g + deltaG * i;
    var b = c1.b + deltaB * i;
    colorcol += '<td width="' + pctvalue + '%" style="background-color: rgb(' + parseInt(r) + "," + parseInt(g) + "," + parseInt(b) + ');"></td>'
    var color = new Color([r,g,b,255]);
    
  }
  colorcol += '<td width="' + pctvalue + '%" style="background-color: rgb(' + c2.r + "," + c2.g + "," + c2.b + ');"></td>'
    colorcol += '</tr>';
    colorcol += '</table>';

    return colorcol;
},
 drawPalette: function(catnum, ck,reverse) {
    //console.log("draw palette" + catnum);
    var selectorOwner = this.selector;
    var rect = selectorOwner.getBoundingClientRect();
    
    var tp = rect.bottom;
    var lt = rect.left;
    // var tp = selectorOwner.offset().top + (selectorOwner.outerHeight());
    // var lt = selectorOwner.offset().left;
    if (document.getElementById("colorlist")) {
        document.getElementById("colorlist").innerHTML = "";
        document.getElementById("colorlist").style.top = parseInt(tp) + "px";
        document.getElementById("colorlist").style.left = parseInt(lt) + "px";
    } else {
        var pandiv = dojo.create("div",
            {
                id: "colorlist",
                style:"position: absolute; z-index: 401; display: none; top: " + parseInt(tp) + "px; left: " + parseInt(lt) + "px; background-color: #cccccc;"
            });
        document.body.appendChild(pandiv);
    }
        var colorstep = parseInt(catnum) - 1;
        var tbobj = dojo.create("table");

        document.getElementById("colorlist").appendChild(tbobj);


        var trobj;
    for (var k = 0; k < this.colorThemes.length; k++) {
        var cobj = this.colorThemes[k];
        var scolor = cobj.startcolor;
        var ecolor = cobj.endcolor;
        if (reverse) {
            scolor = cobj.endcolor;
            ecolor = cobj.startcolor;
        }
        
        if ((k % 2) == 0) {
            trobj = dojo.create("tr");
            tbobj.appendChild(trobj);
        } 
        var str = this.tablePalette(colorstep, scolor, ecolor);
        //console.log("color str: "+str);
        var wobj = this;
        var tdobj = dojo.create("td",{
            style:"padding: 4px 10px 4px 10px;",
            value: k,
            onmouseover: function(e) {this.style.backgroundColor = '#666666';},
            onmouseout: function(e) {this.style.backgroundColor = 'transparent';},
            onclick: function(e) {wobj.changecontent(this,this.value );},
            innerHTML: str
        });
        trobj.appendChild(tdobj);
        
        if (k == ck) {
            //tdobj.style.borderColor = "cyan";
            this.selectcolor.innerHTML = str;
            this.renderform.startcolor.value = scolor;
            this.renderform.endcolor.value = ecolor;

        }
    }
    
    //console.log(document.getElementById("colorlist").innerHTML);
},
_changeSelector: function(e){
    var selectorOwner = this.selectcolor;
    var rect = selectorOwner.getBoundingClientRect();
    
    var tp = rect.bottom;
    var lt = rect.left;
    $("#colorlist").css("top", parseInt(tp) + "px");
    $("#colorlist").css("left", parseInt(lt) + "px");
    
    $("#colorlist").slideToggle("slow");
},
 changecontent: function(dobj,currentindex) {
    //console.log("currentindex: " + currentindex)
    var cobj = this.colorThemes[currentindex];
    var scolor = cobj.startcolor;
    var ecolor = cobj.endcolor;
    if (this.reverseStatus) {
        scolor = cobj.endcolor;
        ecolor = cobj.startcolor;
    }
    var dstr = dobj.innerHTML;
    this.selectcolor.innerHTML = dstr;
    document.getElementById("colorlist").style.display = "none";
    this.currentk = currentindex;
    this.renderform.startcolor.value = scolor;
    this.renderform.endcolor.value = ecolor;
    
},
 highlight: function(dobj) {
    dobj.style.backgroundColor = "cyan";
},
 clearhighlight:function(dobj) {
    dobj.style.backgroundColor = "transparent";
},
    destroy: function () {
        this._zoomHandler.remove();
        dojo.empty(this.domNode);
        this.inherited(arguments);
    }

    // onOpen: function(){
    //   console.log('onOpen');
    // },

    // onClose: function(){
    //   console.log('onClose');
    // },

    // onMinimize: function(){
    //   console.log('onMinimize');
    // },

    // onMaximize: function(){
    //   console.log('onMaximize');
    // },

    // onSignIn: function(credential){
    //   /* jshint unused:false*/
    //   console.log('onSignIn');
    // },

    // onSignOut: function(){
    //   console.log('onSignOut');
    // }
      
    // onPositionChange: function(){
    //   console.log('onPositionChange');
    // },

    // resize: function(){
    //   console.log('resize');
    // }

//methods to communication between widgets:

  });
});