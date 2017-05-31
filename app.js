/*jshint esversion: 6 */
/* global __dirname */
(function() {
  'use strict';
  
  const argv = require('minimist')(process.argv.slice(2));
  const http = require('http');
  const config = require('nconf');
  const util = require('util');
  
  config.file({ file: argv.config || 'config.json' });
  const port = argv.port||3000;
  const app = require(__dirname + '/index')(config);
  
  http.Server(app).listen(port, () => {
    console.log(util.format('listening on *:%d', port));
  });
  
}).call(this);