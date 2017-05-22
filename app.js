/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const argv = require('minimist')(process.argv.slice(2));
  const http = require('http');
  const config = require('nconf');
  const util = require('util');
  const port = argv.port||3000;
  config.file({ file: argv.config || 'config.json' });
  const app = require(__dirname + '/index');
  
  app.listen(port, function(){
    console.log(util.format('listening on *:%d', port));
  });
  
}).call(this);