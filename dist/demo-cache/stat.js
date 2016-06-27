'use strict';
define(['zepto'], function($, _czc) {
  var Stat;
  return Stat = (function() {
    function Stat() {
      this.ua = window.navigator.userAgent.toLowerCase();
      this._czc = _czc || [];
      this._czc.push(["_setAccount", "1258121061"]);
      if (this.isWeixin()) {
        this.openType = '1';
      } else if (this.isIOS()) {
        this.openType = '3';
      } else {
        this.openType = '2';
      }
    }

    Stat.prototype.isAndroid = function() {
      return /android/i.test(this.ua);
    };

    Stat.prototype.isIOS = function() {
      return /(iPhone|iPad|iPod|iOS)/i.test(this.ua);
    };

    Stat.prototype.isWeixin = function() {
      return this.ua.match(/MicroMessenger/i) === "micromessenger";
    };

    Stat.prototype.actionLog = function(eventName) {
      if (this.isIOS()) {
        return window.location.href = 'native:event:' + eventName;
      } else {
        try {
          return window.daka.exec('statis', [eventName]);
        } catch (undefined) {}
      }
    };

    Stat.prototype.shareLog = function(shareType, eventType) {
      return $.ajax({
        url: '/logs-mobile-api/shareLogs/webApi/add',
        type: 'POST',
        dataType: 'JSON',
        data: $.param({
          shareType: shareType,
          eventType: eventType,
          openType: this.openType
        }, {
          success: function(res) {}
        })
      });
    };

    Stat.prototype.inApp = function() {
      var in_app;
      in_app = 0;
      if (/^http:.+userId=.+/.test(window.location.href)) {
        in_app = 1;
      }
      if (window.daka) {
        in_app = 1;
      }
      if (parseInt(this.getCookie('__in_daka')) === 1) {
        in_app = 1;
      }
      this.setCookie('__in_daka', in_app);
      return in_app;
    };

    Stat.prototype.setCookie = function(name, value) {
      var exp;
      exp = new Date();
      exp.setTime(exp.getTime() + 30 * 24 * 60 * 60 * 1000);
      return document.cookie = name + "=" + (escape(value)) + ";expires=" + (exp.toGMTString());
    };

    Stat.prototype.getCookie = function(name) {
      var arr, reg;
      reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
      if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
      } else {
        return null;
      }
    };

    Stat.prototype.pv = function(options) {
      if (this.inApp()) {
        return this.actionLog(options.eventName);
      } else {
        return this.shareLog(options.shareType, 1);
      }
    };

    Stat.prototype.action = function(options) {
      if (this.inApp()) {
        this.actionLog(options.eventName);
      } else if (options.download) {
        this.shareLog(options.shareType, 2);
      }
      return this._czc.push(["_trackEvent", options.pageName, options.actionName]);
    };

    return Stat;

  })();
});
