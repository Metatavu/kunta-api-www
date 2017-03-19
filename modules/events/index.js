/*jshint esversion: 6 */
(function () {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const async = require('async');

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

    latest(maxResults, orderBy, orderDir) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.eventsApi.listOrganizationEvents(this.parent.organizationId, {
          startAfter: (new Date()).toISOString(),
          orderBy: orderBy ? orderBy : 'START_DATE',
          orderDir: orderDir ? orderDir : 'ASCENDING',
          maxResults: maxResults
        })
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
                result.imageId = imageResponse[0].id;
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

  }

  module.exports = function (kuntaApi) {
    return new EventsApi(kuntaApi);
  };

}).call(this);