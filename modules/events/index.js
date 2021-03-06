/*jshint esversion: 6 */
(function () {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const async = require('async');
  const Promise = require('bluebird');

  class EventsApi {

    constructor(parent) {
      this.parent = parent;
      this.eventsApi = new parent.api.EventsApi();
    }
    
    streamImageData(eventId, imageId, query, headers) {
      var url = util.format('%s/organizations/%s/events/%s/images/%s/data', this.parent.basePath, this.parent.organizationId, eventId, imageId);
      this.parent.addPromise(this.parent.promiseStream(url, query, headers));
      return this.parent;
    }
    
    find(id) {
      this.parent.addPromise(new Promise((resolve) => {
        const promises = [this.eventsApi.findOrganizationEvent(this.parent.organizationId, id), this.eventsApi.listOrganizationEventImages(this.parent.organizationId, id)];
        
        Promise.all(promises)
          .then((data) => {
             const event = data[0];
             const images = data[1];
             
             if (images && images.length) {
               event.imageId = images[0].id;
             }
             
             resolve(event);
          })
          .catch(listErr => {
            console.error(util.format('Error finding event %s', id), listErr);
            resolve(null);
          });
      }));

      return this.parent;
    }
    
    /**
     * Lists events from Kunta API
     * 
     * @param {Object} options request options
     * @return {Object} parent object
     */
    list(options) {
      if (arguments.length > 1) {
        // Support for old deprecated version of the method
        return this.list({ 
          firstResult: arguments[0],
          maxResults: arguments[1],
          orderBy: arguments[2],
          orderDir: arguments[3]
        });
      }
      
      const opts = Object.assign({
        startAfter: (new Date()).toISOString(),
        firstResult: 0,
        orderBy: 'START_DATE',
        orderDir: 'ASCENDING'
      }, options);
      
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.eventsApi.listOrganizationEvents(this.parent.organizationId, opts)
          .then(events => {
            var imagePromises = events.map(event => {
              return this.eventsApi.listOrganizationEventImages(
                this.parent.organizationId,
                event.id);
            });

            var results = _.clone(events);

            async.eachOf(results, (result, index, callback) => {
              var imagePromise = imagePromises[index];
              imagePromise.then((imageResponse) => {
                if (imageResponse && imageResponse.length) {
                  result.imageId = imageResponse[0].id;
                }
                callback();
              }).catch((imageError) => {
                console.error('Error loading event image', imageError);
                callback();
              });

            }, () => {
              resolve(results);
            });

          })
          .catch(listErr => {
            console.error('Error listing events', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

    latest(maxResults, orderBy, orderDir) {
      return this.list(0, maxResults, orderBy, orderDir);
    }

  }

  module.exports = function (kuntaApi) {
    return new EventsApi(kuntaApi);
  };

}).call(this);