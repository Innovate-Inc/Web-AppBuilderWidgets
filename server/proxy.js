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

/*global args*/

var request = require('request');
var logger = require('log4js').getLogger('proxy');

exports.proxyRequest = function() {
  return function(req, res, next) {
    try{
      var url;
      if (req.url.indexOf('?') > -1) {
        url = req.url.substr(2);
      } else {
        return next();
      }
      var r;
      var requestParams = null;
      var _headers = {
        authorization: req.headers && req.headers.authorization
      };
      if (req.method === 'GET') {
        requestParams = {
          url: url,
          rejectUnauthorized: false,
          requestCert: true,
          agent: false,
          proxy: args.proxy? args.proxy: undefined,
          secureProtocol: args.sslClientVersion? args.sslClientVersion: 'SSLv23_method'
        };
        if (_headers.authorization) {
          requestParams.headers = _headers;
        }
        r = request.get(requestParams);
        r.pipe(res);
      } else if (req.method === 'POST') {
        requestParams = {
          method: 'POST',
          url: url,
          form: req.body,
          rejectUnauthorized: false,
          requestCert: true,
          agent: false,
          proxy: args.proxy? args.proxy: undefined,
          secureProtocol: args.sslClientVersion? args.sslClientVersion: 'SSLv23_method'
        };
        if (_headers.authorization) {
          requestParams.headers = _headers;
        }
        r = request(requestParams);
        r.pipe(res);
      } else {
        res.send('support get and post only.');
      }
      if(r){
        r.on('error', function(err){
          logger.error('proxy error', err);
        });
        // r.on('response', function(response) {
        //   console.log(response.statusCode); // 200
        //   console.log(response.headers['content-type']); // 'image/png'
        // });
      }
    }
    catch(e){
      console.error(e);
    }
  };
};