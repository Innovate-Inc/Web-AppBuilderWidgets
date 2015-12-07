define([
  'dojo/has',
  'dojo/dom-construct'
], function(
  has,
  domConstruct) {
  return {

    _isIE11: function() {
      var iev = 0;
      var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
      var trident = !!navigator.userAgent.match(/Trident\/7.0/);
      var rv = navigator.userAgent.indexOf("rv:11.0");
      if (ieold) {
        iev = Number(RegExp.$1);
      }
      if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
        iev = 10;
      }
      if (trident && rv !== -1) {
        iev = 11;
      }
      return iev === 11;
    },

    download: function(container, filename, text) {
      if (has("ie") || this._isIE11()) { // has module unable identify ie11
        var oWin = window.top.open("about:blank", "_blank");
        oWin.document.write(text);
        oWin.document.close();
        oWin.document.execCommand('SaveAs', true, filename);
        oWin.close();
      } else {
        var link = domConstruct.create("a", {
          href: 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(text),
          target: '_blank',
          download: filename
        }, container);

        if (has('safari')) {
          // # First create an event
          var click_ev = document.createEvent("MouseEvents");
          // # initialize the event
          click_ev.initEvent("click", true /* bubble */ , true /* cancelable */ );
          // # trigger the evevnt/
          link.dispatchEvent(click_ev);
        } else {
          link.click();
        }

        domConstruct.destroy(link);
      }
    }

  };
});
