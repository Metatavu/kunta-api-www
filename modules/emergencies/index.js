/*jshint esversion: 6 */
(function () {
  'use strict';
  
  const util = require('util');

  class EmergenciesApi {

    constructor(parent) {
      this.parent = parent;
      this.emergenciesApi = new parent.api.EmergenciesApi();
    }

    list(orderBy, orderDir, maxResults) {
      this.parent.addPromise(new Promise((resolve) => {
        this.emergenciesApi.listOrganizationEmergencies(this.parent.organizationId, {
          "orderBy": orderBy,
          "orderDir": orderDir,
          "maxResults": maxResults
        })
        .then(emergencies => {
          resolve(emergencies);
        })
        .catch(listErr => {
          console.error('Error listing emergencies', listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new EmergenciesApi(kuntaApi);
  };

}).call(this);