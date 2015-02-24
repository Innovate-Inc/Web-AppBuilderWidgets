$("#searchbtn").click(function () {
    var kph = $.trim($("#phrase").val());
    if (kph.length>0) {
        galleryViewer.newSearch({ "q": galleryViewer.queryFilter +" AND " + kph });
    } else {
        galleryViewer.newSearch({ "q": galleryViewer.queryFilter });
    }
});

$("#phrase").keydown (function(evt) {
    if (evt.keyCode == '13') {
        var kph = $.trim($(this).val());
        if (kph.length>0) {
            galleryViewer.newSearch({ "q": galleryViewer.queryFilter +" AND " + kph });
        } else {
            galleryViewer.newSearch({ "q": galleryViewer.queryFilter });
        }
        evt.stopImmediatePropagation();
    }    
});

var galleryViewer = {
    setting: {
        viewType: "list",
        pageItemN: 10
    },

    sUrl: "http://www.arcgis.com/sharing/search",
    sQuery: null,

    model: null,

    pageN: 0,

    queryFilter: "",

    init: function (cfg, query) {
        $.extend(this.setting, cfg);
        this.setupViewType();
        this.setupSortBar();
        this.queryFilter = query["q"];
        this.newSearch(query);
    },


    newSearch: function (query) {
        var defaultKV = {
            "start": "1",
            "num": "100",
            "sortField": "uploaded",
            "sortOrder": "desc"
        };

        this.sQuery = $.extend({}, defaultKV, query);

        this.pageN = 0;
        var url = this._genUrl(this.sUrl, this.sQuery);
        $.getJSON(url, function (data) {
            galleryViewer.createModel(galleryViewer.sUrl, galleryViewer.sQuery, data)
            galleryViewer.displayAsync(galleryViewer.pageN);
        }).success(function () {
            //galleryViewer.setupPagination();
            //galleryViewer.setupImgLoader();

        });
    },

    setupImgLoader: function () {
        /*
        if (galleryViewer.setting.viewType === "list") {
        $('img.lazy').asynchImageLoader({ event: 'load+scroll' });
        }
        */
    },

    setupPagination: function () {

        var maxI = Math.ceil(this.model.srN / this.setting.pageItemN);
        var buf = [];

        //?? srN==0 ??

        for (var j = 0; j < maxI; j++) {
            var pgN = j;
            var attrs = {};
            attrs["href"] = "#";
            attrs["id"] = "pg" + pgN;
            attrs["class"] = "pglink";
            attrs["title"] = pgN * this.setting.pageItemN + 1 + "-" + Math.min(this.model.srN, (pgN + 1) * this.setting.pageItemN);
            buf.push('<a ' + this._attrs2str(attrs) + ' >' + (pgN + 1) + '</a>');
        };


        $("#gallery #paginationBar").empty();
        $("#gallery #paginationBar").append(buf.join(" | "));

        for (var i = 0; i < maxI; i++) {
            $("#gallery #pg" + i).live("click", function (evt) {
                galleryViewer.gotoPage(parseInt(this.id.replace("pg", ""), 10));
                evt.stopImmediatePropagation();
                return false;

            });
        }
    },

    setupPagination0: function () {

        var maxI = Math.ceil(this.model.srN / this.setting.pageItemN);
        var buf = [];

        //?? srN==0 ??

        buf.push('<ul id="pagination">')
        if (this.pageN == 0) {
            buf.push('<li class="disabled"><a href="#">Previous</a></li>');
        } else {
            buf.push('<li><a href="#" id="previous">Previous</a></li>');
        }

        var pgL = this._genPaginationL(0, this.pageN, maxI);
        for (var j = 0; j < pgL.length; j++) {
            var pgN = pgL[j];
            if (pgN < 0) {
                buf.push('<li class="ddd">...</li>')
            } else {
                var attrs = {};
                attrs["href"] = "#";
                attrs["id"] = "pg" + pgN;
                attrs["title"] = pgN * this.setting.pageItemN + 1 + "-" + Math.min(this.model.srN, (pgN + 1) * this.setting.pageItemN);
                if (this.pageN == pgN) {
                    buf.push('<li id="current"><a id="currenta" ' + this._attrs2str(attrs) + ' >&nbsp;' + (pgN + 1) + '&nbsp;</a></li>');
                } else {
                    buf.push('<li><a ' + this._attrs2str(attrs) + ' >&nbsp;' + (pgN + 1) + '&nbsp;</a></li>');
                }
            }
        };

        if (this.pageN + 1 == maxI) {
            buf.push('<li class="disabled"><a href="#">Next</a></li>');
        } else {
            buf.push('<li><a href="#" id="next">Next</a></li>');
        }
        buf.push("</ul>")

        $("#gallery #paginationBar").empty();
        $("#gallery #paginationBar").append(buf.join(""));

        $("#pagination li #previous").bind("click", function () {
            var pN = galleryViewer.pageN - 1;
            if (galleryViewer.model.inSRRange(pN)) {
                galleryViewer.gotoPage(pN);
            } else {
                //console.log("out of range: %d", pN);
            }
        });

        $("#pagination li #next").bind("click", function () {
            var pN = galleryViewer.pageN + 1;
            if (galleryViewer.model.inSRRange(pN)) {
                galleryViewer.gotoPage(pN);
            } else {
                //console.log("out of range: %d", pN);
            }
        });

        for (var i = 0; i < maxI; i++) {
            $("#pagination li #pg" + i).bind("click", function () {
                galleryViewer.gotoPage(parseInt(this.id.replace("pg", ""), 10));
            });
        }
    },

    setupSortBar: function () {

        return;

        var setSortBarFun = function (obj, objId) {
            //"#byrelv",
            var idL = ["#byrelv", "#bytitle", "#byowner", "#byrating", "#byview", "#bydate"];
            var sortOrder = "asc";

            if (obj.hasClass("asc")) {
                sortOrder = "desc";
                obj.addClass("desc selected").removeClass("asc");
                for (var i = 0; i < idL.length; i++) {
                    if (idL[i] != objId) {
                        $(idL[i]).removeClass("selected asc desc");
                    }
                }
            } else if (obj.hasClass("desc")) {
                sortOrder = "asc";
                obj.addClass("asc selected").removeClass("desc");
                for (var i = 0; i < idL.length; i++) {
                    if (idL[i] != objId) {
                        $(idL[i]).removeClass("selected asc desc");
                    }
                }
            } else {
                if (objId == "#byview" || objId == "#byrating") {
                    sortOrder = "desc";
                    obj.addClass("desc selected");
                } else {
                    sortOrder = "asc";
                    obj.addClass("asc selected");
                }
                for (var i = 0; i < idL.length; i++) {
                    if (idL[i] != objId) {
                        $(idL[i]).removeClass("selected asc desc");
                    }
                }
            }

            return sortOrder;
        };

        $("#byrelv").addClass("asc selected").removeClass("desc");

        $("#bytitle").click(function () {
            var sortOrder = setSortBarFun($(this), "#bytitle");
            var kph = $.trim($("#phrase").val());
            var query = { "q": galleryViewer.sQuery["q"],
                "sortField": "title",
                "sortOrder": sortOrder
            };
            galleryViewer.newSearch(query);
        });

        $("#byowner").click(function () {
            var sortOrder = setSortBarFun($(this), "#byowner");
            var kph = $.trim($("#phrase").val());
            var query = { "q": galleryViewer.sQuery["q"],
                "sortField": "owner",
                "sortOrder": sortOrder
            };
            galleryViewer.newSearch(query);
        });

        $("#byrating").click(function () {
            var sortOrder = setSortBarFun($(this), "#byrating");
            var kph = $.trim($("#phrase").val());
            var query = { "q": galleryViewer.sQuery["q"],
                "sortField": "avgrating",
                "sortOrder": sortOrder
            };
            galleryViewer.newSearch(query);
        });

        $("#byview").click(function () {
            var sortOrder = setSortBarFun($(this), "#byview");
            var kph = $.trim($("#phrase").val());
            var query = { "q": galleryViewer.sQuery["q"],
                "sortField": "numviews",
                "sortOrder": sortOrder
            };
            galleryViewer.newSearch(query);
        });

        $("#bydate").click(function () {
            var sortOrder = setSortBarFun($(this), "#bydate");
            var kph = $.trim($("#phrase").val());
            var query = { "q": galleryViewer.sQuery["q"],
                "sortField": "uploaded",
                "sortOrder": sortOrder
            };
            galleryViewer.newSearch(query);
        });

    },

    setupViewType: function () {

        return;

        if (this.setting.viewType == "list") {
            $("#listview").addClass("indenton").removeClass("indent");
        } else if (this.setting.viewType == "slim") {
            $("#slimview").addClass("indenton").removeClass("indent");
        }

        $("#listview").live("click", function () {

            $(this).addClass("indenton").removeClass("indent");
            $("#slimview").removeClass("indenton").addClass("indent");

            galleryViewer.setting.viewType = "list";
            galleryViewer.changeView();
            galleryViewer.setupImgLoader();
            return false;
        });

        $("#slimview").live("click", function () {

            $("#listview").removeClass("indenton").addClass("indent");
            $(this).addClass("indenton").removeClass("indent");

            galleryViewer.setting.viewType = "slim";
            galleryViewer.changeView();
            galleryViewer.setupImgLoader();
            return false;
        });

    },

    changeView: function () {
        var itemL = this.model.getData(this.pageN);
        this.displayData(this.pageN, this.setting.viewType, itemL);
    },

    gotoPage: function (pageN) {
        //console.log("goto page: %d", pageN);

        this.pageN = pageN;

        this.model.status();

        if (this.model.inCacheRange(pageN)) {
            //console.log("displaySync");
            this.displaySync(this.pageN);
        } else if (this.model.inSRRange(pageN)) {
            this.sQuery["start"] = (pageN * this.setting.pageItemN + 1).toString();
            var url = this._genUrl(this.sUrl, this.sQuery);
            $.getJSON(url, function (data) {
                galleryViewer.createModel(galleryViewer.sUrl, galleryViewer.sQuery, data)
                //console.log("new model");
                galleryViewer.model.status();
                galleryViewer.displayAsync(galleryViewer.pageN);
            }).success(function () {
                //galleryViewer.setupImgLoader();
            });

        } else {
            //should not happen
        }
    },

    displayData: function (pageN, viewType, itemL) {
        var buf = [];

        var renderFun = galleryViewer.showSlimView;
        switch (viewType) {
            case "slim":
                renderFun = galleryViewer.showSlimView;
                break;
            case "list":
                renderFun = galleryViewer.showListView;
                break;
            default:
                renderFun = galleryViewer.showSlimView;
        };

        var startI = this.setting.pageItemN * pageN;

        var statusTxt = "Showing 0 of 0";
        if (itemL.length > 0) {
            statusTxt = "Showing " + (startI + 1) + "-" + (startI + itemL.length) + " of " + this.model.srN.toString();
        }
        $("#gallery #statusBar").empty();
        $("#gallery #statusBar").append(statusTxt);

        $.each(itemL, function (idx, val) {
            renderFun(buf, startI, idx, val);
        });
        buf.push('<div class="clear"></div>');

        $("#gallery #display").empty();
        $("#gallery #display").append(buf.join(""));

        //galleryViewer.displayTags(galleryViewer.model.tags);
    },

    top10Tags: function (tags) {
        tags.sort(function (a, b) {
            return b.n - a.n;
        });
        return $.map(tags.slice(0, Math.min(tags.length, 20)), function (v, i) { return v.tag; });
    },

    displayTags: function (tags) {
        var tags = this.top10Tags(tags);
        $("#gallery #tags").empty();
        $("#gallery #tags").append(tags.join(" "));
    },

    displayAsync: function (pageN) {
        var itemL = this.model.getData(pageN);
        this.displayData(this.pageN, this.setting.viewType, itemL);

        galleryViewer.setupPagination();
        galleryViewer.setupImgLoader();

    },

    displaySync: function (pageN) {
        var itemL = this.model.getData(pageN);

        this.displayData(pageN, this.setting.viewType, itemL);

        galleryViewer.setupPagination();
        galleryViewer.setupImgLoader();
    },

    _genItemUrl: function (val) {
        if (val.url === null) {
            return "http://www.arcgis.com/home/item.html?id=" + val.id;
        } else {
            return val.url;
        }
    },

    showListView: function (buf, startI, idx, val) {
        //http://www.arcgis.com/sharing/content/items/e6180257b96544b9ad2ed9689336b3b1/info/thumbnail/MarchMadness_thumb.png
        var imgsrc = "http://www.arcgis.com/sharing/content/items/" + val.id + "/info/" + val.thumbnail;
        if (idx % 2 == 0) {
            buf.push('<table style="border: 0px solid #fff;margin-left:0px;"><tr>');
        }

        buf.push('<td style="border: 0px solid #fff;padding:0px"><div style="vertical-align:top" class="g-item">');
        {

            buf.push('<img style="float:left" height="75" width="113" class="shadowbox" src="' + imgsrc + '" />');


            //buf.push('<p>');
            {
                buf.push('<h3>' + (startI + idx + 1) + '. <a href="' + galleryViewer._genItemUrl(val) + '">' + val.title + '</a></h3>');

                var d = new Date(val.uploaded);
                buf.push('<span class="g-info">By: </span>' + val.owner);
                buf.push('<br/><span class="g-info">Modified on: </span>' + d.toDateString());
                /*
                buf.push(' <span class="g-info">Type: </span>' + val.type);
                buf.push(' <br/><span class="g-info">Rating: </span>' + val.avgRating.toFixed(1) + ' ');
                buf.push(' <span class="g-info">Views: </span>' + val.numViews);
                */
                //console.log(val.uploaded);

                /*
                if (val.tags.length > 0) {
                buf.push('<div>tags: ' + val.tags.join(", ") + '</div>');
                }
                if (val.typeKeywords.length > 0) {
                buf.push('<div>typekeywords: ' + val.typeKeywords.join(", ") + '</div>');
                }
                */
            }
            //buf.push('</p>');

        }
        buf.push('</div></td>');

        if (idx % 2 == 1) {
            buf.push("</tr></table>");
        }

        /*
        if (idx % 2 == 1) {
        buf.push('<div class="clear"></div>');
        }*/
    },

    showSlimView: function (buf, startI, idx, val) {
        //http://www.arcgis.com/sharing/content/items/e6180257b96544b9ad2ed9689336b3b1/info/thumbnail/MarchMadness_thumb.png
        buf.push('<div class="gal-listing">');
        {
            buf.push('<div class="fl-slim">');
            {
                buf.push('<h3>' + (startI + idx + 1) + '. <a href="' + galleryViewer._genItemUrl(val) + '">' + val.title + '</a></h3>');
                if (val.snippet == null) {
                    buf.push('<p>' + 'No Short description' + '</p>');
                } else {
                    buf.push('<p>' + val.snippet + '</p>');
                }

                buf.push('<p>');
                buf.push('<span>Type: ' + val.type + '</span> ');
                buf.push('<span>By: ' + val.owner + '</span> ');
                buf.push('<span>Rating: ' + val.avgRating + '</span> ');
                buf.push('<span>Views: ' + val.numViews + '</span> ');
                //console.log(val.uploaded);
                var d = new Date(val.uploaded);
                buf.push('<span>date: ' + d.toDateString() + '</span> ');
                buf.push('</p>');

                /*
                if (val.tags.length > 0) {
                buf.push('<div>tags: ' + val.tags.join(", ") + '</div>');
                }
                if (val.typeKeywords.length > 0) {
                buf.push('<div>typekeywords: ' + val.typeKeywords.join(", ") + '</div>');
                }
                */
            }
            buf.push('</div>');

            buf.push('<div class="clear"></div>');
        }
        buf.push('</div>');
    },


    _genPaginationL: function (minN, n, maxN) {
        var pgL = Array();
        var maxLen = 6;
        if (maxN - minN <= maxLen) {
            for (var i = minN; i < maxN; i++) {
                pgL.push(i);
            }

        } else {
            pgL.push(n);
            maxLen = maxLen - 1;

            var lefti = 1;
            var righti = 1;
            var oldMaxLen = maxLen;

            while (maxLen > 0) {
                oldMaxLen = maxLen;

                var x = n - lefti;

                if (x >= 0) {
                    pgL.push(x);
                    lefti = lefti + 1;
                    maxLen = maxLen - 1;
                }

                x = n + righti;
                if (x < maxN) {
                    pgL.push(x);
                    righti = righti + 1;
                    maxLen = maxLen - 1;
                }

                if (oldMaxLen == maxLen) {
                    break;
                }
            }

            pgL.sort(function (a, b) {
                return a - b;
            });

            if (pgL.length > 0) {
                if (pgL[0] - minN > 2) {
                    pgL.splice(0, 0, -1);
                    pgL.splice(0, 0, minN);
                }

                if (maxN - pgL[pgL.length - 1] > 2) {
                    pgL.push(-1);
                    pgL.push(maxN - 1);
                }
            }
        }

        return pgL;
    },

    genTagDB: function (srL) {
        var tagdb = {};
        var len = 0;
        var tag = "";
        $.each(srL, function (idx, val) {
            len = val.tags.length;
            for (var i = 0; i < Math.min(30, len); i++) {
                tag = val.tags[i];
                if (tag in tagdb) {
                    tagdb[tag] = tagdb[tag] + 1;
                } else {
                    tagdb[tag] = 1;
                }
            }
        });

        var tagL = Array();
        $.each(tagdb, function (key, val) {
            tagL.push({ n: val, tag: key });
        });

        return tagL;
    },


    createModel: function (sUrl, sQuery, data) {
        this.model = (function () {
            return {
                srN: data.total,
                //tags: galleryViewer.genTagDB(data.results),

                _sUrl: sUrl,
                _sQuery: sQuery,
                _minCacheI: data.start - 1,
                _maxCacheI: (data.nextStart > 0) ? data.nextStart - 1 : data.total - 1,
                _cachN: data.num,
                _sr: data.results,

                status: function () {
                    //console.log("url: %s", this._sUrl);
                    //console.log("total: %d cachN: %d cachMin %d cacheMax %d", this.srN, this._cachN, this._minCacheI, this._maxCacheI);
                },

                inCacheRange: function (pageN) {
                    var i = pageN * galleryViewer.setting.pageItemN;
                    return (this._minCacheI <= i && i < this._maxCacheI);
                },

                //in search result range
                inSRRange: function (pageN) {
                    var i = pageN * galleryViewer.setting.pageItemN;
                    return (0 <= i && i < this.srN);
                },

                getData: function (pageN) {
                    var valL = Array()
                    var nextPN = (pageN + 1) * galleryViewer.setting.pageItemN;
                    var begI = (pageN * galleryViewer.setting.pageItemN - this._minCacheI);
                    var endI = (nextPN - this._minCacheI);
                    if (nextPN >= this.srN) {
                        endI = this.srN - this._minCacheI;
                    }

                    //console.log("begI: %d endI: %d", begI, endI);

                    for (var i = begI; i < endI; i++) {
                        valL.push(this._sr[i]);
                    }
                    return valL;
                }
            };
        })();
    },

    _genQueryStr: function (m) {
        var l = Array();
        for (var k in m) {
            l.push(k + "=" + m[k]);
        }
        return l.join("&")
    },

    _genUrl: function (url, query) {
        return this.sUrl + "?" + this._genQueryStr(query) + "&f=json&callback=?";
    },

    _attrs2str: function (m) {
        var buf = [];
        for (var key in m) {
            buf.push(key + '="' + m[key] + '"');
        }

        return buf.join(" ")
    }

};
