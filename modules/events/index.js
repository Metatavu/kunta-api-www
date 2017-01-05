(function () {
  'use strict';

  var util = require('util');
  var _ = require('lodash');
  var async = require('async');

  class EventsApi {

    constructor(parent) {
      this.parent = parent;
      this.eventsApi = new parent.api.EventsApi();
    }

    latest(maxResults) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.eventsApi.listOrganizationEvents(this.parent.organizationId, {
          endAfter: (new Date()).toISOString(),
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
                var basePath = this.parent.basePath;
                var organizationId = this.parent.organizationId;
                var eventId = result.id;
                var imageSrc = imageResponse.length ? util.format('%s/organizations/%s/events/%s/images/%s/data', basePath, organizationId, eventId, imageResponse[0].id) : null;
                result.imageSrc = imageSrc;
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