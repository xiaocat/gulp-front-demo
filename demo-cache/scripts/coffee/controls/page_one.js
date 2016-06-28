'use strict';
define(function(require, exports, module) {
  var page;
  return page = {
    init: function() {
      var $;
      $ = require('coffee/wxshare');
      console.log('Ready go!');
      return console.log($);
    }
  };
});
