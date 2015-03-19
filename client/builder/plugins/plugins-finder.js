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

/*global __dirname*/
var path = require('path');
var fs = require("fs");
var fse;

var pluginsFolder = path.join(__dirname, '.');
var pluginsJsonFile = path.join(pluginsFolder, 'plugins.json');

exports.readAllPlugins = readAllPlugins;
exports.visitSubFolders = visitSubFolders;

exports.setFse = function(_fse){
  fse = _fse;
};

function readAllPlugins(ignoreRules) {
  if(fs.existsSync(pluginsJsonFile)){
    //always delete plugins.json (temporary)
    // fse.deleteSync(pluginsJsonFile);

    //do not re-generate plugins.json
    return;
  }

  console.info('Find plugins...');

  var ignore;
  if(!ignoreRules){
    ignoreRules = [];
    if (fs.existsSync(path.join(pluginsFolder, '.pluginsignore'))) {
      ignore = fs.readFileSync(path.join(pluginsFolder, '.pluginsignore'), {
        encoding: 'utf-8'
      });
      if (ignore) {
        ignoreRules = ignore.split('\r\n');
      }
    }
  }

  var plugins = {}, pluginSubFiles = [];
  visitSubFolders(pluginsFolder, function(filePath, fileName, subFiles){
    var manifestFile = path.join(filePath, 'manifest.json');
    if(!fs.existsSync(manifestFile)) {
      //plugin must have manifest.json
      return;
    }

    var manifest = fse.readJsonSync(manifestFile, 'utf-8');

    if(manifest.type !== 'plugin'){
      return;
    }

    for(var i = 0; i < pluginSubFiles.length; i++){
      if(filePath.startWith(pluginSubFiles[i])){
        //plugin can not contain plugin
        return;
      }
    }

    if(isFolderIgnore(filePath.substr(pluginsFolder.length + 1), ignoreRules)){
      console.info(filePath, 'is ignored.');
      return;
    }

    console.info('...Find plugin', manifest.name);

    if(subFiles){
      var subFilesFullPath = subFiles.map(function(fileName){
        return path.join(filePath, fileName);
      });
      pluginSubFiles = pluginSubFiles.concat(subFilesFullPath);
    }

    processManifest(manifest);
    plugins[manifest.name] = manifest;
  });

  matchExtensions(plugins);
  writePluginsJsonFile(plugins);
  return plugins;
}

function writePluginsJsonFile(plugins){
  //jshint unused:false
  fse.writeJsonSync(pluginsJsonFile, plugins, 'utf-8');
  var count = 0;
  for(var p in plugins){
    count ++;
  }
  console.info('write plugins into plugins.json. Count:' + count);
}

function matchExtensions(plugins){
  for(var pname in plugins){
    var plugin = plugins[pname];
    if(!plugin.extensionPoints){
      continue;
    }

    for(var epName in plugin.extensionPoints){
      var ep = plugin.extensionPoints[epName];
      ep.extensions = getExtentions(ep, plugins);
    }
  }
}

function getExtentions(ep, plugins){
  var extensions = [];
  for(var pname in plugins){
    var plugin = plugins[pname];
    if(!plugin.extensions){
      continue;
    }

    for(var i = 0; i < plugin.extensions.length; i++){
      var ext = plugin.extensions[i];
      ext.pluginName = plugin.name;
      if(ext.point === ep.id){
        if(checkExtensionParams(ep, ext)){
          extensions.push(ext);
        }
      }
    }
  }
  return extensions;
}

function checkExtensionParams(ep, ext){
  if(!ep.parameters){
    return true;
  }

  for(var pName in ep.parameters){
    var param = ep.parameters[pName];
    if(param.required){
      if(typeof ext.parameters === 'undefined' ||
        typeof ext.parameters[pName] === 'undefined'){
        console.error('...', ext.pluginName, 'miss required parameter', pName);
        return false;
      }
    }

    if(typeof ext.parameters === 'undefined' ||
        typeof ext.parameters[pName] === 'undefined'){
      return true;
    }

    if(param.type === 'string' && typeof ext.parameters[pName] !== 'string'){
      console.error('...parameter type mismatched.', ext.pluginName, pName);
      return false;
    }

    if(param.type === 'boolean' && typeof ext.parameters[pName] !== 'boolean'){
      console.error('...parameter type mismatched.', ext.pluginName, pName);
      return false;
    }

    if(param.type === 'function' && typeof ext.parameters[pName] !== 'string'){
      console.error('...parameter type mismatched.', ext.pluginName, pName);
      return false;
    }

    if(param.type === 'url' && typeof ext.parameters[pName] !== 'string'){
      console.error('...parameter type mismatched.', ext.pluginName, pName);
      return false;
    }

    if(param.type === 'number' && typeof ext.parameters[pName] !== 'number'){
      console.error('...parameter type mismatched.', ext.pluginName, pName);
      return false;
    }
  }
  return true;
}


function processManifest(manifest) {
  addManifestProperties(manifest);
  addExtensionPointsInfo(manifest);
}

function addExtensionPointsInfo(manifest){
  if(manifest.extensionPoints){
    for(var epName in manifest.extensionPoints){
      var ep = manifest.extensionPoints[epName];
      ep.id = manifest.name + '.' + epName;
      ep.name = epName;

      for(var paramName in ep.parameters){
        var param = ep.parameters[paramName];
        param.name = paramName;
      }
    }
  }
}

function addManifestProperties(manifest) {
  var properties = ['hasClass', 'hasLocale', 'hasStyle', 'hasUIFile'];

  if(!manifest.properties){
    manifest.properties = {};
  }
  properties.forEach(function(p) {
    if (typeof manifest.properties[p] === 'undefined') {
      manifest.properties[p] = true;
    }
  });
}

//check whether the folder is ignore
function isFolderIgnore(folder, ignoreRules) {
  for (var i = 0; i < ignoreRules.length; i++) {
    if (folder.replace(/\\/g, '/').startWith(ignoreRules[i].replace(/\\/g, '/'))) {
      return true;
    }
  }
  return false;
}

function visitSubFolders(folderPath, cb) {
  var files = fs.readdirSync(folderPath);
  files.forEach(function(fileName){
    var filePath = path.normalize(folderPath + '/' + fileName);

    if(fs.statSync(filePath).isDirectory()){
      if(!cb(filePath, fileName, fs.readdirSync(filePath))){
        visitSubFolders(filePath, cb);
      }
    }
  });
}