(function() {
  'use strict';
  
  class AnnouncementsApi {
    
    constructor(parent) {
      this.parent = parent;
      this.announcementsApi = new parent.api.AnnouncementsApi();
    }
    
    list(maxResults, sortBy, sortDir) { 
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.announcementsApi.listOrganizationAnnouncements(this.parent.organizationId, {
            sortBy: sortBy,
            sortDir: sortDir,
            maxResults: maxResults
          })
          .then(announcements => {
            resolve(announcements);
          })
          .catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new AnnouncementsApi(kuntaApi);
  };
  
}).call(this);