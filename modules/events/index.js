(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  
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
            
            Promise.all(imagePromises)
              .then(imageResponses => {
                var result = _.clone(events);
                
                for (var i = 0, l = result.length; i < l; i++) {
                  var imageResponse = imageResponses[i];
                  var basePath = this.parent.basePath;
                  var organizationId = this.parent.organizationId;
                  var eventId = result[i].id;
                  var imageId = imageResponse[0].id;
                  var imageSrc = imageResponse.length 
                    ? util.format('%s/organizations/%s/events/%s/images/%s/data', basePath, organizationId, eventId, imageId) 
                    : null;
                    result[i].imageSrc = imageSrc;
                }
                
                resolve(result);
              })
              .catch(imagesErr => {
                reject(imagesErr);
              });
          })
          .catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new EventsApi(kuntaApi);
  };
  
}).call(this);