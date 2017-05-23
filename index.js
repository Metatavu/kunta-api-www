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
  
  module.exports = app;
 
}).call(this);