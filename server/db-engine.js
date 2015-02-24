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

var fs = require('fs'), db, engine;

// load config
var cfg = JSON.parse(fs.readFileSync("./config.json"));

// load requestd engine and define engine agnostic getDB function
if (cfg.app.engine === "mongodb") {
  engine = require("mongodb");
  exports.getDB = function() {
    if (!db) {
      db = new engine.Db(cfg.mongo.db,
        new engine.Server(cfg.mongo.host, cfg.mongo.port, cfg.mongo.opts), {
          native_parser: false,
          safe: true
        });
    }
    return db;
  };
} else {
  engine = require("tingodb")({});
  exports.getDB = function() {
    if (!db) {
      if (!fs.existsSync(cfg.tingo.path)) {
        fs.mkdirSync(cfg.tingo.path);
      }
      db = new engine.Db(cfg.tingo.path, {});
    }
    return db;
  };
}
// Depending on engine this can be different class
exports.ObjectID = engine.ObjectID;