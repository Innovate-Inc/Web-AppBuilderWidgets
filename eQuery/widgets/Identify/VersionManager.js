define([
  'jimu/shared/BaseVersionManager'
],
function(
  BaseVersionManager
  ) {
  function VersionManager(){
    this.versions = [{
      version: '1.0',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.1',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    }, {
      version: '1.2',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.1',
      upgrader: function(oldConfig){
        return oldConfig;
      }
    },{
      version: '1.2.0.2',
      upgrader: function(oldConfig){
        var newConfig = oldConfig;
        newConfig.symbols.picturemarkersymbol.url = "images/i_info.png";
        return newConfig;
      }
    }];
  }

  VersionManager.prototype = new BaseVersionManager();
  VersionManager.prototype.constructor = VersionManager;
  return VersionManager;
});
