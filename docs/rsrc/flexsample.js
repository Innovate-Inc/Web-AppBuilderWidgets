
function flexsampleAppBtnH(evt) {
    var sample = $("#flexsample_appbtn");
    if (sample.hasClass("selected")) {

    } else {
        var src = $("#flexsample_srcbtn");
        if (src.hasClass("selected")) {
            src.removeClass("selected");
            $("#flexsrc").toggle();
        }

        sample.addClass("selected");
        $("#flexsample").toggle();

    }

    evt.stopImmediatePropagation();
    return false;
}

function flexsampleSrcBtnH(evt) {
    var src = $("#flexsample_srcbtn");
    if (src.hasClass("selected")) {
    } else {
        var sample = $("#flexsample_appbtn");
        if (sample.hasClass("selected")) {
            sample.removeClass("selected");
            $("#flexsample").toggle();
        }

        src.addClass("selected");
        $("#flexsrc").toggle();
    }

    evt.stopImmediatePropagation();
    return false;
}


$(document) .ready(function () {
    $("#flexsample_appbtn").live("click", flexsampleAppBtnH);
    $("#flexsample_srcbtn").live("click", flexsampleSrcBtnH);
	
});
