

$(document).ready(function () {
    function clickTabH(evt) {
        var tabId = evt.currentTarget.id,
        tab = $("#" + tabId),
        src = tabId.substring(3).toLowerCase(),
        tabs = ["tabXaml", "tabCs", "tabVb"],
        i = 0;

        if (tab.hasClass("TabBlueSelected")) {

        } else {
            for (i = 0; i < tabs.length; i++) {
                var oTabId = tabs[i],
                oTab = $("#" + oTabId),
                oSrc = oTabId.substring(3).toLowerCase();

                if (oTabId !== tabId) {
                    if (oTab.hasClass("TabBlueSelected")) {
                        oTab.removeClass("TabBlueSelected");
                        $("#" + oSrc).toggle();
                    }
                }
            }

            tab.addClass("TabBlueSelected");
            $("#" + src).toggle();
        }

        evt.stopImmediatePropagation();
        return false;
    }

    $("#tabXaml").live("click", clickTabH);
    $("#tabCs").live("click", clickTabH);
    $("#tabVb").live("click", clickTabH);
 
	var dlbtn = $("#dlBtn").detach();
    dlbtn.prependTo(".header");
});
