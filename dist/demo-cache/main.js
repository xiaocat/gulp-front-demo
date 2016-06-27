'use strict';
requirejs.config({
  baseUrl: 'scripts',
  paths: {
    'zepto': 'libs/zepto',
    'require': 'libs/require',
    'coffee': 'coffee',
    'jweixin': 'http://res.wx.qq.com/open/js/jweixin-1.0.0',
    'stat': 'http://s11.cnzz.com/z_stat.php?id=1258121061&web_id=1258121061'
  },
  shim: {
    'zepto': {
      exports: '$'
    },
    'jweixin': {
      exports: 'wx'
    },
    'stat': {
      exports: '_czc'
    }
  }
});

require(['coffee/config', 'coffee/controls/' + document.body.dataset.js], function(Config, page) {
  console.log(Config);
  console.log('page start!!!');
  return page.init();
});
