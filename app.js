(function() {
  'use strict';

  var argv = require('minimist')(process.argv.slice(2));
  var util = require('util');
  var config = require('nconf');
  var path = require('path');
  var express = require('express');
  var Modules = require('./modules'); 
  
  config.file({ file: argv.config || 'config.json' });
  var port = argv.port||3000;

  var app = express();
  var http = require('http').Server(app);
  app.set('view engine', 'pug');
  
  var implementation = require(config.get('implementation'))();
  
  app.set('views',implementation.views);
  app.use(express.static(implementation.static));
  app.use(express.static(path.join(__dirname, 'public')));
  implementation.routes(app, config, Modules);
  
  http.listen(port, function(){
    console.log(util.format('listening on *:%d', port));
  });
 
}).call(this);