define(
[],
function() {
 var _config = {"demogJSON": {
    "ejdemog": { "title": "2008-2012 ACS", "tiptext": "2008-2012 ACS", "type": "agsdemog", "layerurl": "https://ejscreen.epa.gov/ArcGIS/rest/services/", "service": "ejscreen/census2012acs", "lookupindex": 4,
        "description": "2008-2012 ACS demographics are a set of variables derived based on a subset of 2008-2012 American Community Survey data.",
        "process": false,"transparency": "0.8", "defaultCategoryIndex": 8,
        "baselayers": {
            "bg": { "minlevel": 10, "maxlevel": 20, "layeridx": 0, "level": "2008-2012 ACS (Blockgroup)" }
        , "tr": { "minlevel": 8, "maxlevel": 10, "layeridx": 1, "level": "2008-2012 ACS (Tract)" }
        , "cnty": { "minlevel": 4, "maxlevel": 8, "layeridx": 2, "level": "2008-2012 ACS (County)" }
        , "st": { "minlevel": 0, "maxlevel": 4, "layeridx": 3, "level": "2008-2012 ACS (State)" }
    },
        "dynamiclayers": {}
    }

    , "census2010": { "title": "2010 Census", "tiptext": "2010 ACS", "type": "agsdemog", "layerurl": "https://ejscreen.epa.gov/ArcGIS/rest/services/", "service": "ejscreen/census2010sf1", "lookupindex": 5,
        "description": "2010 Census contains a set of variables derived based on a subset of 2010 Census data.",
        "process": false, "transparency": "0.8", "defaultCategoryIndex": 3,
        "baselayers": {
            "blk": { "minlevel": 16, "maxlevel": 20, "layeridx": 0, "level": "2010 Census (Block)" }
           , "bg": { "minlevel": 10, "maxlevel": 16, "layeridx": 1, "level": "2010 Census (Blockgroup)" }
        , "tr": { "minlevel": 8, "maxlevel": 10, "layeridx": 2, "level": "2010 Census (Tract)" }
        , "cnty": { "minlevel": 4, "maxlevel": 8, "layeridx": 3, "level": "2010 Census (County)" }
        , "st": { "minlevel": 0, "maxlevel": 4, "layeridx": 4, "level": "2010 Census (State)" }
        },
        "dynamiclayers": {}
    }
    , "census2k": { "title": "2000 Census", "tiptext": "2000 SF3", "type": "agsdemog", "layerurl": "https://ejscreen.epa.gov/ArcGIS/rest/services/", "service": "ejscreen/census2000sf3", "lookupindex": 4,
        "description": "2000 Census contains a set of variables derived based on a subset of 2000 Census data.",
        "process": false, "transparency": "0.8", "defaultCategoryIndex": 6,
        "baselayers": {
            "bg": { "minlevel": 10, "maxlevel": 20, "layeridx": 0, "level": "2000 Census (Blockgroup)" }
        , "tr": { "minlevel": 8, "maxlevel": 10, "layeridx": 1, "level": "2000 Census (Tract)" }
        , "cnty": { "minlevel": 4, "maxlevel": 8, "layeridx": 2, "level": "2000 Census (County)" }
        , "st": { "minlevel": 0, "maxlevel": 4, "layeridx": 3, "level": "2000 Census (State)" }
        },
        "dynamiclayers": {}
    }
    }
};
return _config;
  
});