/*jshint esversion: 6 */
(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const _ = require('lodash');
  const locale = require('locale');
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });  

  const KuntaApi = require(__dirname + '/../kunta-api.js');
  const EventsModule = require(__dirname + '/events');
  const NewsModule = require(__dirname + '/news');
  const BannersModule = require(__dirname + '/banners');
  const TileModule = require(__dirname + '/tiles');
  const MenusModule = require(__dirname + '/menus');
  const SocialMediaModule = require(__dirname + '/socialmedia');
  const PagesModule = require(__dirname + '/pages');
  const FilesModule = require(__dirname + '/files');
  const JobsModule = require(__dirname + '/jobs');
  const AnnouncementsModule = require(__dirname + '/announcements');
  
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
      this.menus = new MenusModule(this);
      this.socialMedia = new SocialMediaModule(this);
      this.pages = new PagesModule(this);
      this.files = new FilesModule(this);
      this.jobs = new JobsModule(this);
      this.announcements = new AnnouncementsModule(this);

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

    selectBestLocale (localized, preferLanguages) {
      var localeContents = _.mapKeys(localized, (item) => {
        return item.language;
      });
      
      var contentLocales = _.keys(localeContents);
      var prefered = _.isArray(preferLanguages) ? preferLanguages : [preferLanguages];
      if (_.indexOf(prefered, 'fi')) {
         prefered.push('fi');
      }

      var bestLocale = (new locale.Locales(prefered)).best(new locale.Locales(contentLocales));
     
      return localeContents[bestLocale] ? localeContents[bestLocale].value : null;
    }
    
  };
  
  module.exports = KuntaApiModules;
  
}).call(this);
