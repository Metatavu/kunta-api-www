/*jshint esversion: 6 */
(() => {
  'use strict';
  
  const util = require('util');

  class ContactsApi {

    constructor(parent) {
      this.parent = parent;
      this.contactsApi = new parent.api.ContactsApi();
    }

    search(search, firstResult, maxResults, sortBy) {
      this.parent.addPromise(new Promise((resolve) => {
        this.contactsApi.listOrganizationContacts(this.parent.organizationId, {
          "search": search,
          "firstResult": firstResult,
          "maxResults": maxResults,
          "sortBy": sortBy
        })
        .then(resolve)
        .catch(listErr => {
          console.error('Error listing contacts', listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new ContactsApi(kuntaApi);
  };

})();