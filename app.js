(function() {
  'use strict';

  var config = require('./config.json');
  var path = require('path');
  var express = require('express');
  var modules = require('./modules'); 
 
  var app = express();
  var http = require('http').Server(app);
  app.set('view engine', 'pug');
  
  var implementation = require(config.implementation)();
  
  app.set('views',implementation.views);
  app.use(express.static(implementation.static));
  app.use(express.static(path.join(__dirname, 'public')));
  implementation.routes(app, modules);
  
  http.listen(3000, function(){
    console.log('listening on *:3000');
  });
 
}).call(this);