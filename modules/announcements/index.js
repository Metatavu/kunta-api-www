/*jshint esversion: 6 */
(function () {
  'use strict';
  
  const util = require('util');

  class AnnouncementsApi {

    constructor(parent) {
      this.parent = parent;
      this.announcementsApi = new parent.api.AnnouncementsApi();
    }

    findBySlug(slug) {
      this.parent.addPromise(new Promise((resolve) => {
        this.announcementsApi.listOrganizationAnnouncements(this.parent.organizationId, {
          slug: slug
        }).then(announcements => {
          resolve(announcements.length > 0 ? announcements[0] : null);
        }).catch(listErr => {
          console.error(util.format('Failed to find announcement by slug %s', slug), listErr);
          resolve(null);
        });
      }));

      return this.parent;
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
            console.error('Error listing announcements', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new AnnouncementsApi(kuntaApi);
  };

}).call(this);