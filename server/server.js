/*
Copyright ©2014 Esri. All rights reserved.
 
TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States and applicable international
laws, treaties, and conventions.
 
For additional information, contact:
Attn: Contracts and Legal Department
Environmental Systems Research Institute, Inc.
380 New York Street
Redlands, California, 92373
USA
 
email: contracts@esri.com
*/

/* global __dirname, global, process*/
/* jshint es3: false */
/**
 * Module dependencies.
 */
var requirejs = require('requirejs');
requirejs.config({
  nodeRequire: require,
  baseUrl: '../client/stemapp',
  paths: {
    'jimu': 'jimu.js',
    'widgets': 'widgets',
    'themes': 'themes'
  }
});

var express = require('express');
var builderIndex = require('./routes');
var utils = require('./utils');
var appRest = require('./rest/apps');
var themeRest = require('./rest/themes');
var widgetRest = require('./rest/widgets');
var signinInfoRest = require('./rest/signininfo');
var repoRest = require('./rest/repo');
var net = require('net');
var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var proxy = require('./proxy');
var dbEngine = require('./db-engine');
var log4js = require('log4js');

//middlewares
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var compression = require('compression');
var cookieParser = require('cookie-parser');

var app = express();

//init logger
if (!fs.existsSync(__dirname + '/logs')) {
  fs.mkdirSync(__dirname + '/logs');
}
log4js.configure('log4js.json');
var logger = log4js.getLogger('server');

var db = dbEngine.getDB();
global.db = db;

checkAndInitData(db);

//get command line parameter
var _args = process.argv.splice(2);
var args = {};
_args.forEach(function(arg) {
  var a = arg.split('=');
  var param = a[0];
  var val = a[1];
  switch (param) {
  case "-port":
    args.port = val;
    break;
  case "-proxy":
    args.proxy = val;
    break;
  case "-jsapi":
    args.pathDevJsapi = val;
    break;
  case "-dojo":
    args.pathDevDojo = val;
    break;
  case "-sslClientVersion":
  //available options are: SSLv2_method, SSLv3_method, TLSv1_method,
  //if not set, the value is SSLv23_method
  //https://www.openssl.org/docs/ssl/ssl.html#DEALING_WITH_PROTOCOL_METHODS
    args.sslClientVersion = val;
    break;
  }
});
global.args = args;

if(args.proxy){
  console.log('Server using proxy: ' + args.proxy);
}
setEnv();

useMiddleWares();
mapUrl();

var options = {
  key: fs.readFileSync('./cakey.pem'),
  cert: fs.readFileSync('./cacert.pem')
};

var basePort = app.get('port');
var httpPort, httpsPort;
if (basePort === '80') {
  httpPort = '80';
  httpsPort = '443';
} else {
  httpPort = parseInt(basePort, 10) + 1;
  httpsPort = parseInt(basePort, 10) + 2;

  console.log('Server listening tcp connection on port ' + basePort + ' in ' +
    app.get('env') + ' mode');
  net.createServer({
    allowHalfOpen: true
  }, onTcpConnection).listen(basePort);
}

function onTcpConnection(conn) {
  conn.once('data', function(buf) {
    try {
      // A TLS handshake record starts with byte 22.
      var address = (buf[0] === 22) ? httpsPort : httpPort;
      var proxy = net.createConnection(address, function() {
        try {
          proxy.write(buf);
          conn.pipe(proxy).pipe(conn);
        } catch (err) {
          logger(err);
        }
      });

      proxy.on('error', function() {
        // logger.debug('on tcp proxy error');
      });
    } catch (err) {
      logger(err);
    }
  });

  conn.on('error', function() {
    // logger.debug('on tcp error');
  });
}

http.createServer(app).listen(httpPort, function() {
  console.log('Server listening http connection on port ' + httpPort + ' in ' +
    app.get('env') + ' mode');
});

https.createServer(options, app).listen(httpsPort, function() {
  console.log('Server listening https connection on port ' + httpsPort + ' in ' +
    app.get('env') + ' mode');
});

function setEnv() {
  if (!fs.existsSync(__dirname + '/uploads')) {
    fs.mkdirSync(__dirname + '/uploads');
  }

  app.set('port', args.port || process.env.PORT || 3344);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
}

function useMiddleWares() {
  app.use(log4js.connectLogger(log4js.getLogger('express')));

  app.use(cookieParser());
  app.use(compression());

  app.use(bodyParser({
    limit: '50mb'
  }));

  app.use(function(req, res, next) {
    //set cookie
    res.cookie('wab_xt', true, {path: '/webappbuilder'});
    res.cookie('wab_xt', true, {path: '/webapp'});

    if (req.method === "GET" && req.url === '/webapp') {
      //add end slash to /webapp
      res.writeHead(301, {
        "Location": req.url + '/'
      });
      res.end();
    }else if(req.url === '/'){
      res.redirect('/webappbuilder/');
      return;
    }
    next();
  });

  //force set portal URL and sign in
  app.use(function(req, res, next) {
    if (!/webappbuilder$/.test(req.path) &&
      !/webappbuilder\/$/.test(req.path) &&
      !/webappbuilder\/index.html$/.test(req.path) ||
      req.query.action === 'setportalurl') {
      next();
      return;
    }
    
    var redirectUrl;
    if(!req.cookies.wab_portalurl_persistent){
      if (req.url.indexOf('?') > -1 && !req.url.endWith('?')) {
        if (req.query.action) {
          redirectUrl = req.url.replace(/(action=)(.+)/, '$1setportalurl');
        } else {
          redirectUrl = req.url + '&action=setportalurl';
        }
      } else if (req.url.endWith('?')) {
        redirectUrl = req.url + 'action=setportalurl';
      } else {
        redirectUrl = req.url + '?action=setportalurl';
      }
      logger.info('No portal URL is set, redirect', req.url, 'to', redirectUrl);
      res.redirect(redirectUrl);
      return;
    }

    if (req.query.action === 'signin') {
      next();
      return;
    }

    var info = signinInfoRest.getSignInInfoByPortalUrlApi(req.cookies.wab_portalurl_persistent);
    //if portal uses web-tier authorization, we should not check token from cookie
    //let user sigin in IWA portal in the front end
    if(info && info.isWebTier){
      logger.info("Portal " + info.portalUrl + ' uses web-tier authorization.');
    }else{
      if (!info || !utils.getTokenFromRequest(info.portalUrl, req)) {
        //the request url has not action for now

        //if user don't signin, redirect to set portal url page.
        if (req.url.indexOf('?') > -1 && !req.url.endWith('?')) {
          redirectUrl = req.url + '&action=setportalurl';
        } else if (req.url.endWith('?')) {
          redirectUrl = req.url + 'action=setportalurl';
        } else {
          redirectUrl = req.url + '?action=setportalurl';
        }
        logger.info('No token is found, redirect', req.url, 'to', redirectUrl);
        res.redirect(redirectUrl);
        return;
      }
    }
    
    next();
  });

  //redirect url
  app.use(function(req, res, next) {
    if (req.method === "GET" && /(stemapp|stemapp\/|stemapp\/index.html)\?id=(.+)/.test(req.url)) {
      var appId = req.param('id');
      var query = '';
      for (var p in req.query) {
        if (p === 'id') {
          continue;
        }
        if (query === '') {
          query = '?' + p + '=' + req.param(p);
        } else {
          query = query + '&' + p + '=' + req.param(p);
        }
      }
      res.redirect('/webappbuilder/apps/' + appId + query);
      logger.info('redirect ', req.url, 'to', '/webappbuilder/apps/' + appId + query);
      return;
    }
    next();
  });

  // development only
  if ('development' === app.get('env')) {
    setupDevEnv();
  }

  app.use(errorHandler());

  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.send(500, 'Something broke!');
    /*jshint unused: false*/
  });
}

function setupDevEnv() {
  // register dojo source version for use in unit tests
  var devDojoPath;
  if (args.pathDevDojo && fs.existsSync(args.pathDevDojo)) {
    devDojoPath = args.pathDevDojo;
  } else if (fs.existsSync(path.join(__dirname, '../client/libs/dojo'))) {
    devDojoPath = path.join(__dirname, '../client/libs/dojo');
  }
  if (devDojoPath) {
    console.log("register /dojo -> " + devDojoPath);
    app.use('/dojo', express.static(devDojoPath));
  }

  // register local provided js api (the folder must directly contain the "js" folder of the api, no version number sub directory)
  if (args.pathDevJsapi && fs.existsSync(args.pathDevJsapi)) {
    mapJsApi('arg', args.pathDevJsapi);
  } else if (fs.existsSync(path.join(__dirname, '../client/libs/arcgis_js_api'))) {
    fs.readdirSync(path.join(__dirname, '../client/libs/arcgis_js_api')).forEach(function(file) {
      mapJsApi(file, path.join(__dirname, '../client/libs/arcgis_js_api', file));
    });
  }

  function mapJsApi(name, path) {
    console.log("register /arcgis_js_api/" + name + " -> " + path);
    app.use('/arcgis_js_api/' + name, express.static(path));
    app.get('/arcgis_js_api/' + name, function(req, res) {
      res.sendfile(path + '/js/dojo/dojo/dojo.js');
    });
  }
}

function mapUrl() {
  app.use('/proxy.js', proxy.proxyRequest());
  app.use('/webapp', express.static(path.join(__dirname, '../client/stemapp')));
  app.use('/webappbuilder', express.static(path.join(__dirname, '../client')));
  app.use('/webappbuilder/apps', express.static(path.join(__dirname, './apps')));

  app.use('/widgets/', express.static(path.join(__dirname, '../client/stemapp/widgets')));
  app.use('/themes/', express.static(path.join(__dirname, '../client/stemapp/themes')));

  if(fs.existsSync(path.join(__dirname, '../docs'))){
    app.use('/webappbuilder/help', express.static(path.join(__dirname, '../docs')));
  }

  /************** app rest *******************/
  app.all('/builder/rest/*', function(req, res, next){
    res.set('Content-Type', 'application/json;charset=utf-8');
    res.set('Cache-Control', 'no-cache');
    next();
  });

  app.get('/builder/rest/apps/list', appRest.getAppList);
  app.get('/builder/rest/apps/:appId', appRest.getApp);
  app.get('/builder/rest/apps/:appId/download', appRest.download);
  app.get('/builder/rest/apps/:appId/downloadagoltemplate', appRest.downloadAGOLTemplate);
  
  app.post('/builder/rest/apps/checkversion', appRest.checkAppVersion);
  app.post('/builder/rest/apps/import', appRest.importApp);
  app.post('/builder/rest/apps/updateapp', appRest.updateApp);
  app.post('/builder/rest/apps/updateagoltemplateinapp', appRest.updateAgolTemplateInApp);
  app.post('/builder/rest/apps/createapp', appRest.createApp);
  app.post('/builder/rest/apps/removeapp', appRest.removeApp);
  app.post('/builder/rest/apps/duplicateapp', appRest.duplicateApp);
  app.post('/builder/rest/apps/:appId/saveconfig', appRest.saveAppConfig);
  app.post('/builder/rest/apps/:appId/copywidget', appRest.copyWidgetToApp);
  app.post('/builder/rest/apps/:appId/copytheme', appRest.copyThemeToApp);

  /************** theme rest *******************/
  app.get('/builder/rest/themes/getall', themeRest.getThemes);

  /************** widget rest *******************/
  // app.get('/builder/rest/widgets/list', widgetRest.getAllWidgets);
  app.get('/builder/rest/widgets/search', widgetRest.searchWidgets);
  /************** setting rest ***********************/
  app.get('/builder/rest/signininfo/getsignininfos', signinInfoRest.getSignInInfos);
  app.get('/builder/rest/signininfo/getsignininfo', signinInfoRest.getSignInInfoByPortalUrl);
  app.post('/builder/rest/signininfo/setsignininfo', signinInfoRest.setSigninInfo);
}

/*************************************************************/
function checkAndInitData(db) {
  repoRest.initWorkingRepositories();
}

String.prototype.startWith = function(str) {
  if (this.substr(0, str.length) === str) {
    return true;
  } else {
    return false;
  }
};

String.prototype.endWith = function(str) {
  if (this.substr(this.length - str.length, str.length) === str) {
    return true;
  } else {
    return false;
  }
};