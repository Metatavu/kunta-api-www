/*jshint esversion: 6 */
(function () {
  'use strict';
  
  const util = require('util');

  class IncidentsApi {

    constructor(parent) {
      this.parent = parent;
      this.incidentsApi = new parent.api.IncidentsApi();
    }

    list(endAfter) {
      this.parent.addPromise(new Promise((resolve) => {
        this.incidentsApi.listOrganizationIncidents(this.parent.organizationId, {
          "endAfter": endAfter
        })
        .then(incidents => {
          resolve(incidents);
        })
        .catch(listErr => {
          console.error('Error listing incidents', listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new IncidentsApi(kuntaApi);
  };

}).call(this);