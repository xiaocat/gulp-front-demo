'use strict';
define(['zepto', 'jweixin'], function($, wx) {
  var WxShare;
  return WxShare = (function() {
    function WxShare(title, desc, icon, url) {
      this.title = title;
      this.desc = desc;
      this.icon = icon;
      this.url = url;
      this._wxConfig = {
        debug: false,
        appId: '',
        timestamp: '',
        nonceStr: '',
        signature: '',
        jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareQZone', 'onMenuShareWeibo']
      };
      this.weixin();
      this.wxconfig();
    }

    WxShare.prototype.wxdata = function() {
      return {
        title: this.title,
        desc: this.desc,
        link: this.url,
        imgUrl: this.icon
      };
    };

    WxShare.prototype.weixin = function() {
      if (wx == null) {
        return;
      }
      return wx.ready((function() {
        wx.onMenuShareAppMessage(this.wxdata());
        wx.onMenuShareTimeline(this.wxdata());
        wx.onMenuShareQQ(this.wxdata());
        wx.onMenuShareQZone(this.wxdata());
        return wx.onMenuShareWeibo(this.wxdata());
      }).bind(this));
    };

    WxShare.prototype.wxconfig = function() {
      var _wxConfig;
      if (wx == null) {
        return;
      }
      _wxConfig = this._wxConfig;
      return $.ajax({
        type: 'POST',
        url: location.protocol + '//' + location.host + '/h5-mobile-api/wxSignature',
        dataType: 'json',
        timeout: 6e3,
        data: {
          'url': window.location.href
        },
        success: function(rData) {
          var vo;
          if (rData) {
            vo = rData;
            _wxConfig.appId = vo.appId;
            _wxConfig.timestamp = vo.timestamp;
            _wxConfig.nonceStr = vo.nonceStr;
            _wxConfig.signature = vo.signature;
            return wx.config(_wxConfig);
          }
        }
      });
    };

    return WxShare;

  })();
});
