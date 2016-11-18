(function() {
  'use strict';
  
  class JobsApi {
    
    constructor(parent) {
      this.parent = parent;
      this.jobsApi = new parent.api.JobsApi();
    }
    
    list(maxResults, sortBy, sortDir) { 
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.jobsApi.listOrganizationJobs(this.parent.organizationId, {
            sortBy: sortBy,
            sortDir: sortDir,
            maxResults: maxResults
          })
          .then(jobs => {
            resolve(jobs);
          })
          .catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new JobsApi(kuntaApi);
  };
  
}).call(this);