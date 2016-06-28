'use strict';
define(['zepto'], function($) {
  var Native;
  return Native = (function() {
    function Native() {
      this.ua = window.navigator.userAgent.toLowerCase();
    }

    Native.prototype.getUrlParam = function(name) {
      var r, reg;
      reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
      r = window.location.search.substr(1).match(reg);
      if (r !== null) {
        return unescape(r[2]);
      }
      return null;
    };

    Native.prototype.isAndroid = function() {
      return /android/i.test(this.ua);
    };

    Native.prototype.isIOS = function() {
      return /(iPhone|iPad|iPod|iOS)/i.test(this.ua);
    };

    Native.prototype.isWeixin = function() {
      return this.ua.match(/MicroMessenger/i) === "micromessenger";
    };

    Native.prototype.inApp = function() {
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

    Native.prototype.setCookie = function(name, value) {
      var exp;
      exp = new Date();
      exp.setTime(exp.getTime() + 30 * 24 * 60 * 60 * 1000);
      return document.cookie = name + "=" + (escape(value)) + ";expires=" + (exp.toGMTString());
    };

    Native.prototype.getCookie = function(name) {
      var arr, reg;
      reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
      if (arr = document.cookie.match(reg)) {
        return unescape(arr[2]);
      } else {
        return null;
      }
    };

    Native.prototype.getUserId = function() {
      var data, userId;
      userId = '';
      if (this.getUrlParam('userId')) {
        userId = this.getUrlParam('userId');
      }
      if (this.inApp()) {
        try {
          data = window.oil.getMobileApp();
          data = data.replace(/\s/g, '');
          if (JSON.parse(atob(data) && JSON.parse(atob(data)).userId)) {
            userId = userId || JSON.parse(atob(data)).userId;
          }
        } catch (undefined) {}
      }
      if (this.getCookie('__daka_user')) {
        userId = userId || this.getCookie('__daka_user');
      }
      if (userId != null) {
        this.setCookie('__daka_user', userId);
      }
      return userId;
    };

    return Native;

  })();
});
