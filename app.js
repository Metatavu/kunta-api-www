/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const argv = require('minimist')(process.argv.slice(2));
  const http = require('http');
  const config = require('nconf');
  const util = require('util');
  const port = argv.port||3000;
  const app = require(__dirname + '/index');
  
  config.file({ file: argv.config || 'config.json' });
  const implementation = require(config.get('implementation'))();
  
  app.set('views',implementation.views);
  app.use(express.static(implementation.static));
  app.use(express.static(path.join(__dirname, 'public')));
  implementation.routes(app, config, Modules);
  
  app.listen(port, function(){
    console.log(util.format('listening on *:%d', port));
  });
  
}).call(this);