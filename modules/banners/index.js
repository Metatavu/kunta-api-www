/*jshint esversion: 6 */
(function () {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const async = require('async');
  const request = require('request');

  class BannersApi {

    constructor(parent) {
      this.parent = parent;
      this.bannersApi = new parent.api.BannersApi();
    }
    
    streamImageData(bannerId, imageId, query, headers) {
      var url = util.format('%s/organizations/%s/banners/%s/images/%s/data', this.parent.basePath, this.parent.organizationId, bannerId, imageId);
      this.parent.addPromise(this.parent.promiseStream(url, query, headers));
      return this.parent;
    }

    list() {
      this.parent.addPromise(new Promise((resolve) => {
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
                if (imageResponse.length) {
                  result.imageId = imageResponse[0].id;
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