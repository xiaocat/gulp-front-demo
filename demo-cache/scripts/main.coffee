'use strict'

_cnzz_id = '1258121061'

requirejs.config
  baseUrl: 'scripts'
  paths:
    'zepto': 'libs/zepto'
    'require': 'libs/require'
    'jweixin': 'http://res.wx.qq.com/open/js/jweixin-1.0.0'
    'cnzz': "http://s11.cnzz.com/z_stat.php?id=#{_cnzz_id}&web_id=#{_cnzz_id}"
  shim:
    'zepto':
      exports: '$'
    'jweixin':
      exports: 'wx'
    'cnzz':
      exports: '_czc'

require ['coffee/config', 'coffee/controls/' + document.body.dataset.js ], (Config, page)->
  console.log Config
  console.log 'page start!!!'
  page.init()
