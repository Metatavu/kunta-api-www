(function () {
  'use strict';

  var util = require('util');
  var _ = require('lodash');
  var async = require('async');

  class BannersApi {

    constructor(parent) {
      this.parent = parent;
      this.bannersApi = new parent.api.BannersApi();
    }

    list() {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.bannersApi.listOrganizationBanners(this.parent.organizationId)
          .then(banners => {
            var imagePromises = banners.map(banner => {
              return this.bannersApi.listOrganizationBannerImages(
                this.parent.organizationId,
                banner.id);
            });

            var results = _.clone(banners);

            async.eachOf(results, (result, index, callback) => {
              var imagePromise = imagePromises[index];
              imagePromise.then((imageResponse) => {
                var basePath = this.parent.basePath;
                var organizationId = this.parent.organizationId;
                if (imageResponse.length) {
                  result.imageSrc = util.format('%s/organizations/%s/banners/%s/images/%s/data', basePath, organizationId, result.id, imageResponse[0].id);
                }
                callback();
              }).catch((imageError) => {
                console.error('Error loading banner image', imageError);
                callback();
              });

            }, () => {
              resolve(results);
            });

          }).catch(listErr => {
            console.error('Error listing banners', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new BannersApi(kuntaApi);
  };

}).call(this);