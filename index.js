/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const argv = require('minimist')(process.argv.slice(2));
  const util = require('util');
  const config = require('nconf');
  const path = require('path');
  const express = require('express');
  const Modules = require('./modules'); 
  const port = argv.port||3000;
  const app = express();
  const http = require('http').Server(app);
  app.set('view engine', 'pug');
  
  config.file({ file: argv.config || __dirname + '/../../test/config/config.json' });
  const implementation = require(config.get('implementation'))();
  
  app.set('views',implementation.views);
  app.use(express.static(implementation.static));
  app.use(express.static(path.join(__dirname, 'public')));
  implementation.routes(app, config, Modules);
  
  module.exports = app;
 
}).call(this);