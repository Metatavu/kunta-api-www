/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';

  const _ = require('lodash');
  const util = require('util');
  const path = require('path');
  const express = require('express');
  const Modules = require('./modules'); 
  const pug = require('pug');
  const bodyParser = require('body-parser');
  
  const app = express();
  
  module.exports = (config) => {
    app.set('view engine', 'pug');
    const implementation = require(config.get('implementation'))();
    app.set('views',implementation.views);
    app.set('trust proxy', 'loopback');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended : true
    }));
  
    if (_.isArray(implementation.static)) {
      implementation.static.forEach((staticFolder) => {
        app.use(express.static(staticFolder));
      });
    } else {
      app.use(express.static(implementation.static));
    }
    
    app.use(express.static(path.join(__dirname, 'public')));
    implementation.routes(app, config, Modules);
    return app;
  };
 
}).call(this);