'use strict'

define (require, exports, module)->
  page =
    init: ->
      $ = require 'coffee/wxshare'
      console.log 'Ready go!'
      console.log $
