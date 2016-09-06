(function() {
  'use strict';
  
  var util = require('util');
  
  class EventsApi {
    
    constructor(parent) {
      this.parent = parent;
      this.eventsApi = new parent.api.EventsApi();
    }
    
    latest(count) { 
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.eventsApi.listOrganizationEvents(this.parent.organizationId)
          .then(events => {
            var filteredEvents = events.slice(0, count);
            
            var imagePromises = filteredEvents.map(event => {
              return this.eventsApi.listOrganizationEventImages(this.parent.organizationId, event.id);
            });
            
            Promise.all(imagePromises)
              .then(imageResponses => {
                for (var i = 0, l = filteredEvents.length; i < l; i++) {
                  var imageResponse = imageResponses[i];
                  var basePath = this.parent.basePath;
                  var organizationId = this.parent.organizationId;
                  var eventId = filteredEvents[i].id;
                  var imageId = imageResponse[0].id;
                  var imageSrc = imageResponse.length ? util.format('%s/organizations/%s/events/%s/images/%s/data', basePath, organizationId, eventId, imageId) : null;
                  filteredEvents[i].imageSrc = imageSrc;
                }
                
                resolve(filteredEvents);
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
  }
  
}).call(this);