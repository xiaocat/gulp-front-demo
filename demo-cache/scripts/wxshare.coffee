'use strict'

define ['zepto'], ($, wx)->

  class WxShare
    constructor: (@title, @desc, @icon, @url) ->
      @_wxConfig =
        debug: false # 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: '' # 必填，公众号的唯一标识
        timestamp: '' # 必填，生成签名的时间戳
        nonceStr: '' # 必填，生成签名的随机串
        signature: '' # 必填，签名
        jsApiList: ['onMenuShareTimeline','onMenuShareAppMessage','onMenuShareQQ','onMenuShareQZone','onMenuShareWeibo'] # 必填，需要使用的JS接口列表，所有JS接口列表见附录2

      this.weixin()
      this.wxconfig()

    wxdata: ->
      title: @title
      desc: @desc
      link: @url
      imgUrl: @icon

    weixin: ->
      return if !wx?
      wx.ready (->
        wx.onMenuShareAppMessage this.wxdata()
        # 分享到朋友圈
        wx.onMenuShareTimeline this.wxdata()
        # 分享到qq
        wx.onMenuShareQQ this.wxdata()
        # 分享到qq空间
        wx.onMenuShareQZone this.wxdata()
        # 分享到腾讯微博
        wx.onMenuShareWeibo this.wxdata()
      ).bind(this)

    wxconfig: ->
      return if !wx?
      _wxConfig = @_wxConfig
      $.ajax
        type: 'POST'
        url: location.protocol + '//' + location.host + '/h5-mobile-api/wxSignature'
        dataType: 'json'
        timeout: 6e3
        data : {'url' : window.location.href}
        success: (rData)->
          if (rData)
            vo = rData
            _wxConfig.appId = vo.appId
            _wxConfig.timestamp = vo.timestamp
            _wxConfig.nonceStr = vo.nonceStr
            _wxConfig.signature = vo.signature
            wx.config(_wxConfig);
