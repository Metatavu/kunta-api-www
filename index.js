/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const util = require('util');
  const path = require('path');
  const express = require('express');
  const Modules = require('./modules'); 
  const app = express();
  
  module.exports = (config) => {
    app.set('view engine', 'pug');
    const implementation = require(config.get('implementation'))();
    app.set('views',implementation.views);
    app.use(express.static(implementation.static));
    app.use(express.static(path.join(__dirname, 'public')));
    implementation.routes(app, config, Modules);
    return app;
  };
 
}).call(this);