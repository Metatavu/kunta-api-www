(function() {
  'use strict';
  
  var config = require(__dirname + '/../config.json');
  var kuntaApi = require(__dirname + '/../kunta-api')({
    basePath: config.api.basePath
  });
  
  var EventsModule = require(__dirname + '/events');
  
  class KuntaApiModules {
    
    constructor(api, organizationId) {
      this.api = api;
      this.organizationId = organizationId;
      this.events = EventsModule(this);
      this._promises = [];
    }
    
    addPromise (promise) {
      this._promises.push(promise);
    }
    
    callback (then, error) {
      Promise.all(this._promises)
        .then(then)
        .catch(error);
    }
    
  };
  
  module.exports = new KuntaApiModules(kuntaApi, config.defaults.organizationId);
  
}).call(this);