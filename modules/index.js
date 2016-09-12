(function() {
  'use strict';
  
  var config = require(__dirname + '/../config.json');
  var kuntaApi = new require(__dirname + '/../kunta-api')({
    basePath: config.api.basePath
  });
  
  var EventsModule = require(__dirname + '/events');
  var NewsModule = require(__dirname + '/news');
  var BannersModule = require(__dirname + '/banners');
  
  class KuntaApiModules {
    
    constructor(api, organizationId, basePath) {
      this.api = api;
      this.organizationId = organizationId;
      this.basePath = basePath;
      this.events = new EventsModule(this);
      this.news = new NewsModule(this);
      this.banners = new BannersModule(this);
      this._promises = [];
    }
    
    addPromise (promise) {
      this._promises.push(promise);
      return promise;
    }
    
    callback (then, error) {
      Promise.all(this._promises)
        .then(then)
        .catch(error);
    }
    
  };
  
  module.exports = new KuntaApiModules(kuntaApi, 
      config.defaults.organizationId, 
      config.api.basePath);
  
}).call(this);