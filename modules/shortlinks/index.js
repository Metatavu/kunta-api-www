(function () {
  'use strict';

  class ShortlinksApi {

    constructor(parent) {
      this.parent = parent;
      this.shortlinksApi = new parent.api.ShortlinksApi();
    }

    list() {
      this.parent.addPromise(new Promise((resolve) => {
        this.shortlinksApi.listOrganizationShortlinks(this.parent.organizationId)
          .then(shortlinks => {
            resolve(shortlinks);
          }).catch(listErr => {
            console.error('Error listing shortlinks', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new ShortlinksApi(kuntaApi);
  };

}).call(this);