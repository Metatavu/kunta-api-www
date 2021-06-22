const KuntaApiClient = require('kunta-api-client');

/*jshint esversion: 6 */
(function () {
  'use strict';

  class JobsApi {

    constructor(parent) {
      this.parent = parent;

      const clientInstance = new KuntaApiClient.ApiClient();
      clientInstance.basePath = this.parent.config.get('api:jobsBasePath') || this.parent.config.get('api:basePath');
      clientInstance.defaultHeaders = this.parent.defaultHeaders;

      this.jobsApi = new parent.api.JobsApi(clientInstance);
    }
    
    findById(jobId) { 
      this.parent.addPromise(this.jobsApi.findOrganizationJob(this.parent.organizationId, jobId));

      return this.parent;
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
          console.error('Error listing jobs', listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new JobsApi(kuntaApi);
  };

}).call(this);