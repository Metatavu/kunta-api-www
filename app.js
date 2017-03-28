/* global __dirname */

(function() {
  'use strict';

  const argv = require('minimist')(process.argv.slice(2));
  const util = require('util');
  const config = require('nconf');
  
  config.file({ file: argv.config || 'config.json' });
  
  const path = require('path');
  const express = require('express');
  const Modules = require('./modules'); 
  const port = argv.port||3000;
  const app = express();
  const http = require('http').Server(app);
  app.set('view engine', 'pug');
  
  const implementation = require(config.get('implementation'))();
  
  app.set('views',implementation.views);
  app.use(express.static(implementation.static));
  app.use(express.static(path.join(__dirname, 'public')));
  implementation.routes(app, config, Modules);
  
  http.listen(port, function(){
    console.log(util.format('listening on *:%d', port));
  });
 
}).call(this);