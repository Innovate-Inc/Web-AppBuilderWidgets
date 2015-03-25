//>>built
define("dojo/_base/declare dojo/_base/lang dojo/_base/html dojo/_base/array dojo/Deferred dojo/promise/all dojo/request jimu/utils".split(" "),function(l,h,m,g,n,p,q,k){return l(null,{appConfig:void 0,currentStyleName:void 0,currentLayoutName:void 0,_manifest:void 0,constructor:function(b){this._manifest=b;this.domNodes={}},clear:function(){var b;this.appConfig=null;for(b=0;b<this._manifest.layouts.length;b++)if("appLayout"===this._manifest.layouts[b].name){this._manifest.layouts[b].domNode&&m.destroy(this._manifest.layouts[b].domNode);
this._manifest.layouts.splice(b,1);break}},loadLayouts:function(){var b=new n,e=[],a=g.filter(this._manifest.layouts,function(a){return"appLayout"!==a.name});g.forEach(a,function(a){e.push(q(this._manifest.url+a.uri,{handleAs:"json"}))},this);p(e).then(h.hitch(this,function(d){g.forEach(a,function(a,c){a.layoutConfig=d[c]},this);b.resolve()}),function(){b.reject()});return b},setAppConfig:function(b){this.appConfig=b},getName:function(){return this._manifest.name},getVersion:function(){return this._manifest.version},
getLabel:function(){return this._manifest.label},getIcon:function(){return this._manifest.icon},getLayouts:function(){return this._manifest.layouts},getStyles:function(){return this._manifest.styles},getUrl:function(){return this._manifest.url},getCurrentStyle:function(){return this.getStyleByName(this.currentStyleName)},getCurrentLayout:function(){return this.getLayoutByName(this.currentLayoutName)},changeCurrentStyle:function(b){this.currentStyleName=b},changeCurrentLayout:function(b){this.currentLayoutName=
b},addLayout:function(b,e,a,d){var f,c=this.getLayouts();for(f=0;f<c.length;f++)if(c[f].name===b)return null;b={description:"this is current app layout",name:b,label:d,layoutConfig:e,domClass:a};this._manifest.layouts.push(b);return b},getStyleByName:function(b){var e,a=null;for(e=0;e<this._manifest.styles.length;e++)if(this._manifest.styles[e].name===b){a=this._manifest.styles[e];break}return a},getLayoutByName:function(b){var e,a=null;for(e=0;e<this._manifest.layouts.length;e++)if(this._manifest.layouts[e].name===
b){a=this._manifest.layouts[e];break}return a},getLayoutByAppConfig:function(b){var e,a=null;for(e=0;e<this._manifest.layouts.length;e++)if(this.isAppUseLayout(b,this._manifest.layouts[e].layoutConfig)){a=this._manifest.layouts[e];break}return a},isAppUseLayout:function(b,e){var a=h.clone(b),d=h.clone(e);a.map||(a.map={});d.map||(d.map=a.map);a.map.position||(a.map.position={left:0,top:0});d.map.position||(d.map.position=a.map.position);if(!k.isEqual(a.map.position,d.map.position))return!1;a.widgetOnScreen||
(a.widgetOnScreen={});d.widgetOnScreen||(d.widgetOnScreen={});a.widgetOnScreen.widgets||(a.widgetOnScreen.widgets=[]);d.widgetOnScreen.widgets||(d.widgetOnScreen.widgets=[]);a.widgetOnScreen.groups||(a.widgetOnScreen.groups=[]);d.widgetOnScreen.groups||(d.widgetOnScreen.groups=[]);var f,c;f=a.widgetOnScreen.widgets.length<d.widgetOnScreen.widgets.length?a.widgetOnScreen.widgets.length:d.widgetOnScreen.widgets.length;for(c=0;c<f;c++){a.widgetOnScreen.widgets[c].positionRelativeTo||(a.widgetOnScreen.widgets[c].positionRelativeTo=
"map");d.widgetOnScreen.widgets[c].positionRelativeTo||(d.widgetOnScreen.widgets[c].positionRelativeTo=a.widgetOnScreen.widgets[c].positionRelativeTo);if(a.widgetOnScreen.widgets[c].positionRelativeTo!==d.widgetOnScreen.widgets[c].positionRelativeTo)return!1;a.widgetOnScreen.widgets[c].position||(a.widgetOnScreen.widgets[c].position={left:0,top:0});d.widgetOnScreen.widgets[c].position||(d.widgetOnScreen.widgets[c].position=a.widgetOnScreen.widgets[c].position);if(!k.isEqual(a.widgetOnScreen.widgets[c].position,
d.widgetOnScreen.widgets[c].position))return!1}f=a.widgetOnScreen.groups.length<d.widgetOnScreen.groups.length?a.widgetOnScreen.groups.length:d.widgetOnScreen.groups.length;for(c=0;c<f;c++){a.widgetOnScreen.groups[c].panel||(a.widgetOnScreen.groups[c].panel={});d.widgetOnScreen.groups[c].panel||(d.widgetOnScreen.groups[c].panel=a.widgetOnScreen.groups[c].panel);a.widgetOnScreen.groups[c].panel.positionRelativeTo||(a.widgetOnScreen.groups[c].panel.positionRelativeTo="map");d.widgetOnScreen.groups[c].panel.positionRelativeTo||
(d.widgetOnScreen.groups[c].panel.positionRelativeTo=d.widgetOnScreen.groups[c].panel.positionRelativeTo);if(a.widgetOnScreen.groups[c].panel.positionRelativeTo!==d.widgetOnScreen.groups[c].panel.positionRelativeTo)return!1;a.widgetOnScreen.groups[c].panel.position||(a.widgetOnScreen.groups[c].panel.position={left:0,top:0});d.widgetOnScreen.groups[c].panel.position||(d.widgetOnScreen.groups[c].panel.position=a.widgetOnScreen.groups[c].panel.position);if(!k.isEqual(a.widgetOnScreen.groups[c].panel.position,
d.widgetOnScreen.groups[c].panel.position))return!1}return!0},getLayoutFromConfig:function(b){var e={};b=h.clone(b);b.widgetOnScreen&&(e.widgetOnScreen={},b.widgetOnScreen.widgets&&(e.widgetOnScreen.widgets=[],g.forEach(b.widgetOnScreen.widgets,function(a,b){e.widgetOnScreen.widgets[b]={position:a.position?a.position:{left:0,top:0}}})),b.widgetOnScreen.groups&&(e.widgetOnScreen.groups=[],g.forEach(b.widgetOnScreen.groups,function(a,b){e.widgetOnScreen.groups[b]={position:a.position?a.position:{left:0,
top:0}}})));b.map&&(e.map={position:b.map.position});return e}})});