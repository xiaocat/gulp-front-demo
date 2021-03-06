'use strict'

define ['zepto'], ($)->
  class Native
    constructor: ->
      @ua = window.navigator.userAgent.toLowerCase()
    getUrlParam: (name)->
    	reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)")
    	r = window.location.search.substr(1).match(reg)
    	return unescape(r[2]) if (r != null)
    	return null
    isAndroid: ->
      /android/i.test(@ua)
    isIOS: ->
      /(iPhone|iPad|iPod|iOS)/i.test(@ua)
    isWeixin: ->
      @ua.match(/MicroMessenger/i)=="micromessenger"
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
    getUserId: ->
      userId = ''
      userId = this.getUrlParam('userId') if this.getUrlParam('userId')
      if this.inApp()
        try
          data = window.oil.getMobileApp()
          data = data.replace(/\s/g, '');
          if JSON.parse atob(data) && JSON.parse(atob(data)).userId
            userId = userId || JSON.parse(atob(data)).userId
      userId = userId || this.getCookie '__daka_user' if this.getCookie '__daka_user'
      this.setCookie '__daka_user',userId if userId?
      return userId
