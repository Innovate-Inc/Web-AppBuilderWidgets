/*global weinreUrl, loadResources, _loadPolyfills, loadingCallback, debug, allCookies, unescape */
/*jshint unused:false*/

var dojoConfig, isBuilder = true;

window.isRunInPortal = !window.isXT;
window.isBuilder = true;//important

//store hash here because IdentityManager will remove the hash info
window.originalHash = window.location.hash;
var oauthSuccess = window.originalHash.indexOf('access_token=') >= 0;
var oauthError = window.originalHash.indexOf('error=') >= 0 &&
  window.originalHash.indexOf("error_description=") >= 0;

var ie = (function() {

  var undef,
    v = 3,
    div = document.createElement('div'),
    all = div.getElementsByTagName('i');

  div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->';
  while(all[0]){
    div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->';
  }
  return v > 4 ? v : undef;
}());

if ((oauthSuccess || oauthError) && ie > 8) {
  window.location.hash = '';
}

(function(argument) {
  if (ie < 8){
    var mainLoading = document.getElementById('main-loading');
    var appLoading = document.getElementById('app-loading');
    var ieNotes = document.getElementById('ie-note');
    appLoading.style.display = 'none';
    ieNotes.style.display = 'block';
    mainLoading.style.backgroundColor="#fff";
    return;
  }
  
  if (!window.apiUrl) {
    console.error('no apiUrl.');
  } else if (!window.path) {
    console.error('no path.');
  } else {
    if(window.location.protocol === 'https:'){
      var reg = /^http:\/\//i;
      if(reg.test(window.apiUrl)){
        window.apiUrl = window.apiUrl.replace(reg, 'https://');
      }
      if(reg.test(window.path)){
        window.path = window.path.replace(reg, 'https://');
      }
    }

    /*jshint unused:false*/
    dojoConfig = {
      parseOnLoad: false,
      async: true,
      tlmSiblingOfDojo: false,
      has: {
        'extend-esri': 1
      }
    };

    if(allCookies.esri_auth){
      /*jshint -W061 */
      var userObj = eval('(' + unescape(allCookies.esri_auth)+ ')');
      if(userObj.culture){
        dojoConfig.locale = userObj.culture;
      }
    }
    if (allCookies.arcgisLocale) {
      dojoConfig.locale = allCookies.arcgisLocale.toLowerCase();
    }
    if (allCookies.wab_locale) {
      dojoConfig.locale = allCookies.wab_locale.toLowerCase();
    }
    if(!dojoConfig.locale){
      dojoConfig.locale = navigator.language ? navigator.language : navigator.userLanguage;
    }
    dojoConfig.locale = dojoConfig.locale.toLowerCase();
    window._setRTL(dojoConfig.locale);

    var resources = [
      window.apiUrl + 'dojo/resources/dojo.css',
      window.apiUrl + 'dijit/themes/claro/claro.css',
      window.apiUrl + 'dojox/editor/plugins/resources/css/TextColor.css',
      window.apiUrl + 'dojox/editor/plugins/resources/editorPlugins.css',
      window.apiUrl + 'dojox/editor/plugins/resources/css/PasteFromWord.css',
      window.apiUrl + 'esri/css/esri.css',
      window.path + 'stemapp/jimu.js/css/jimu.css',
      window.path + 'builder/css/builder.css',
      window.path + 'builder/css/config.css',
      window.path + 'builder/js/libs/ace/ace.js',
      window.path + 'builder/js/libs/thenBy.js'
    ];

    if (window.apiUrl.substr(window.apiUrl.length - 'stemapp/arcgis-js-api/'.length,
      'stemapp/arcgis-js-api/'.length) === 'stemapp/arcgis-js-api/') {
      //after build, we put js api here
      //user can also download release api package and put here
      dojoConfig.baseUrl = window.path;
      dojoConfig.packages = [{
        name: "dojo",
        location: window.apiUrl + "dojo"
      }, {
        name: "dijit",
        location: window.apiUrl + "dijit"
      }, {
        name: "dojox",
        location: window.apiUrl + "dojox"
      }, {
        name: "put-selector",
        location: window.apiUrl + "put-selector"
      }, {
        name: "xstyle",
        location: window.apiUrl + "xstyle"
      }, {
        name: "dgrid",
        location: window.apiUrl + "dgrid"
      }, {
        name: "esri",
        location: window.apiUrl + "esri"
      }, {
        name: "jimu",
        location: 'stemapp/jimu.js'
      }, {
        name: "libs",
        location: "stemapp/libs"
      }, {
        name: "dynamic-modules",
        location: "stemapp/dynamic-modules"
      }, {
        name: "builder",
        location: "builder/js/app"
      }];

      resources.push(window.apiUrl + '/dojo/dojo.js');
    } else {
      dojoConfig.baseUrl = window.apiUrl + 'dojo';
      dojoConfig.packages = [{
        name: "builder",
        location: window.path + "builder/js/app"
      }, {
        name: "jimu",
        location: window.path + 'stemapp/jimu.js'
      }, {
        name: "libs",
        location: window.path + "stemapp/libs"
      }, {
        name: "dynamic-modules",
        location: window.path + "stemapp/dynamic-modules"
      }];

      resources.push(window.apiUrl + 'init.js');
    }

    if (debug) {
      resources.push(weinreUrl);
    }

    loadResources(resources, null, function(url, loaded) {
      if (typeof loadingCallback === 'function') {
        loadingCallback(url, loaded, resources.length);
      }
    }, function() {
      continueLoad();

      function continueLoad(){
        if(typeof require === 'undefined'){
          if (window.console){
            console.log('Waiting for API loaded.');
          }
          setTimeout(continueLoad, 100);
          return;
        }

        _loadPolyfills("stemapp/", function() {
          require(['jimu/main'], function() {
            require(['builder/main'], function() {
              loadingCallback('builder', resources.length + 1, resources.length);
            });
          });
        });
      }
    });
  }
})();