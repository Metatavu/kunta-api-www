/*jshint esversion: 6 */
(function () {
  'use strict';

  class EnvironmentalWarningsApi {

    constructor(parent) {
      this.parent = parent;
      this.environmentalWarningsApi = new parent.api.EnvironmentalWarningsApi();
    }

    list(orderBy, orderDir, maxResults, startBefore, startAfter, contexts) {
      this.parent.addPromise(new Promise((resolve) => {
        this.environmentalWarningsApi.listOrganizationEnvironmentalWarnings(this.parent.organizationId, {
          "orderBy": orderBy,
          "orderDir": orderDir,
          "maxResults": maxResults,
          "startBefore": startBefore,
          "startAfter": startAfter,
          "contexts": contexts
        })
        .then(environmentalWarnings => {
          resolve(environmentalWarnings);
        })
        .catch(listErr => {
          console.error('Error listing environmental warnings', listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new EnvironmentalWarningsApi(kuntaApi);
  };

}).call(this);