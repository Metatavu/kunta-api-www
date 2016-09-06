(function() {
  'use strict';
  
  class EventsApi {
    
    constructor(parent) {
      this.parent = parent;
      this.eventsApi = new parent.api.EventsApi();
    }
    
    latest(count) {
      this.parent.addPromise(this.eventsApi.listOrganizationEvents(this.parent.organizationId));
      return this.parent;
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new EventsApi(kuntaApi);
  }
  
}).call(this);