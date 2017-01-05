/*eslint-env es6*/

(function () {
  'use strict';

  var util = require('util');
  var _ = require('lodash');
  var async = require('async');

  class TilesApi {

    constructor(parent) {
      this.parent = parent;
      this.tilesApi = new parent.api.TilesApi();
    }

    list() {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.tilesApi.listOrganizationTiles(this.parent.organizationId)
          .then(tiles => {
            var imagePromises = tiles.map(tile => {
              return this.tilesApi.listOrganizationTileImages(
                this.parent.organizationId,
                tile.id);
            });

            var results = _.clone(tiles);

            async.eachOf(results, (result, index, callback) => {
              var imagePromise = imagePromises[index];
              imagePromise.then((imageResponse) => {
                if (imageResponse.length) {
                  result.imageSrc = this.getImageUrl(result.id,
                    imageResponse[0].id);
                }
                callback();
              }).catch((imageError) => {
                console.error('Error loading tile image', imageError);
                callback();
              });

            }, (err) => {
              resolve(results);
            });

          }).catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
    }

    getImageUrl(tileId, imageId) {
      var basePath = this.parent.basePath;
      var organizationId = this.parent.organizationId;

      return util.format('%s/organizations/%s/tiles/%s/images/%s/data',
        basePath, organizationId, tileId, imageId);
    }

  }

  module.exports = function (kuntaApi) {
    return new TilesApi(kuntaApi);
  };

}).call(this);