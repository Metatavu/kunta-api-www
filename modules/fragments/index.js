/*jshint esversion: 6 */
(function () {
  'use strict';
  
  const util = require('util');

  class FragmentsApi {

    constructor(parent) {
      this.parent = parent;
      this.fragmentsApi = new parent.api.FragmentsApi();
    }

    findBySlug(slug) {
      this.parent.addPromise(new Promise((resolve) => {
        this.fragmentsApi.listOrganizationFragments(this.parent.organizationId, {
          slug: slug
        }).then(fragments => {
          resolve(fragments.length > 0 ? fragments[0] : null);
        }).catch(listErr => {
          console.error(util.format('Failed to find fragment by slug %s', slug), listErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    list() {
      this.parent.addPromise(new Promise((resolve) => {
        this.fragmentsApi.listOrganizationFragments(this.parent.organizationId)
          .then(fragments => {
            resolve(fragments);
          })
          .catch(listErr => {
            console.error('Error listing fragments', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new FragmentsApi(kuntaApi);
  };

}).call(this);