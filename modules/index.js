/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const Promise = require('bluebird');
  const _ = require('lodash');
  const locale = require('locale');
  const request = require('request');  
  
  process.on('unhandledRejection', function(error, promise) {
    console.error("UNHANDLED REJECTION", error.stack);
  });  

  const KuntaApi = require(__dirname + '/kunta-api.js');
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
  const FragmentsModule = require(__dirname + '/fragments');
  const PublicTransportModule = require(__dirname + '/publictransport');
  const ShortlinksModule = require(__dirname + '/shortlinks');
  const IncidentsModule = require(__dirname + '/incidents');
  const EmergenciesModule = require(__dirname + '/emergencies');
  const LinkedEventsModule = require(__dirname + '/linkedevents');
  
  class KuntaApiModules {
    
    constructor(config, organizationId) {
      this.config = config;
      this.organizationId = organizationId || this.config.get('defaults:organizationId');
      this.basePath = this.config.get('api:basePath');
      this.defaultHeaders = this.config.get('defaults:headers');
      this.api = new KuntaApi({ basePath: this.basePath, defaultHeaders: this.defaultHeaders });
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
      this.fragments = new FragmentsModule(this);
      this.publicTransport = new PublicTransportModule(this);
      this.shortlinks = new ShortlinksModule(this);
      this.incidents = new IncidentsModule(this);
      this.emergencies = new EmergenciesModule(this);
      this.linkedevents = new LinkedEventsModule(this);
      
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
    
    promiseStream (url, query, headers) {
      return new Promise((resolve) => {
        var forwardHeaderNames = ['if-none-match', 'cache-control'];
        var requestHeaders = null;
        
        if (headers) {
          requestHeaders = {};
          _.each(headers, (value, key) => {
            if (forwardHeaderNames.indexOf(key.toLowerCase()) > -1) {
              requestHeaders[key] = value;
            }
          });
        }
        
        if (this.defaultHeaders) {
          if (!headers) {
            requestHeaders = {};
          }
          _.each(this.defaultHeaders, (value, key) => {
            requestHeaders[key] = value;
          });
        }
        
        var options = {
          url: url,
          headers: requestHeaders,
          qs: query
        };
        
        resolve(request.get(options));
      });
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
