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

    Native.prototype.alertmess = function(str, time) {
      var fullH, fullW, html, twidth;
      if (time == null) {
        time = 2000;
      }
      html = '<div class="mess">' + str + '</div>';
      fullW = $(window).width();
      fullH = $(window).height();
      twidth = parseInt(fullW * 0.8);
      if ($('.mess').size() < 1) {
        $('body').append(html);
        $('.mess').css({
          'width': twidth,
          'min-height': '30px',
          'line-height': '30px',
          'font-size': '16px',
          'marginLeft': parseInt(-twidth / 2 - 10),
          'background': 'rgba(0, 0, 0, .8)',
          'color': '#fff',
          'z-index': 99999,
          'position': 'fixed',
          'left': '50%',
          'top': '40%',
          'border-radius': '5px',
          'text-align': 'center',
          'padding': '5px 10px',
          'box-sizing': 'content-box'
        }).fadeIn();
        return setTimeout((function() {
          return $('.mess').fadeOut(1000, function() {
            return $('.mess').remove();
          });
        }), time);
      }
    };

    Native.prototype.shareCallback = function() {
      return window.share.callback = function(res) {
        if (this.isAndroid()) {
          res = window.atob(res);
        } else {
          res = window.atob(window.daka.getShareStatus());
        }
        return alert(res);
      };
    };

    Native.prototype.changeShareTitle = function() {
      return window.share.title = '测试。。。';
    };

    return Native;

  })();
});
