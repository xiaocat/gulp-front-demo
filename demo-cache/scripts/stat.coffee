'use strict'

define ['zepto'], ($, _czc)->
  class Stat
    constructor: ()->
      @ua = window.navigator.userAgent.toLowerCase()
      @_czc = _czc || [];
      @_czc.push(["_setAccount", "1258121061"]);
      if this.isWeixin()
        @openType = '1'
      else if this.isIOS()
        @openType = '3'
      else
        @openType = '2'
    isAndroid: ->
      /android/i.test(@ua)
    isIOS: ->
      /(iPhone|iPad|iPod|iOS)/i.test(@ua)
    isWeixin: ->
      @ua.match(/MicroMessenger/i)=="micromessenger"
    # 用户行为统计
    actionLog: (eventName)->
      if this.isIOS()
        window.location.href = 'native:event:' + eventName
      else
        try window.daka.exec('statis',[eventName])
    # 分享统计
    shareLog: (shareType, eventType)->
      $.ajax
        url: '/logs-mobile-api/shareLogs/webApi/add'
        type: 'POST'
        dataType: 'JSON'
        data: $.param {shareType:shareType, eventType:eventType, openType:@openType},
        success: (res)->
    inApp: ->
      in_app = 0
      in_app = 1 if /^http:.+userId=.+/.test window.location.href
      in_app = 1 if window.daka
      in_app = 1 if parseInt(this.getCookie '__in_daka') == 1

      this.setCookie '__in_daka',in_app
      return in_app
    setCookie: (name,value)->
      exp = new Date()
      exp.setTime(exp.getTime() + 30*24*60*60*1000)
      document.cookie = "#{name}=#{escape(value)};expires=#{exp.toGMTString()}"
    getCookie: (name)->
      reg= new RegExp("(^| )" + name + "=([^;]*)(;|$)")
      if arr=document.cookie.match(reg)
        return unescape arr[2]
      else
        return null
    pv: (options)->
      if this.inApp()
        this.actionLog options.eventName
      else
        this.shareLog options.shareType, 1

    action: (options)->
      if this.inApp()
        this.actionLog options.eventName
      else if options.download
        this.shareLog options.shareType, 2
      @_czc.push ["_trackEvent", options.pageName, options.actionName]
