(function() {
  'use strict';
  
  var KuntaApi = require(__dirname + '/../kunta-api.js');
  var EventsModule = require(__dirname + '/events');
  var NewsModule = require(__dirname + '/news');
  var BannersModule = require(__dirname + '/banners');
  var TileModule = require(__dirname + '/tiles');
  var MenuModule = require(__dirname + '/menus');
  var SocialMediaModule = require(__dirname + '/socialmedia');
  
  class KuntaApiModules {
    
    constructor(config) {
      this.config = config;
      this.organizationId = this.config.get('defaults:organizationId');
      this.basePath = this.config.get('api:basePath');
      this.api = new KuntaApi({ basePath: this.basePath });
      this.events = new EventsModule(this);
      this.news = new NewsModule(this);
      this.banners = new BannersModule(this);
      this.tiles = new TileModule(this);
      this.menus = new MenuModule(this);
      this.socialMedia = new SocialMediaModule(this);
      
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
  
  module.exports = KuntaApiModules;
  
}).call(this);