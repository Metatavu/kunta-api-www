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
    
    streamImageData(tileId, imageId, query, headers) {
      var url = util.format('%s/organizations/%s/tiles/%s/images/%s/data', this.parent.basePath, this.parent.organizationId, tileId, imageId);
      this.parent.addPromise(this.parent.promiseStream(url, query, headers));
      return this.parent;
    }

    list() {
      this.parent.addPromise(new Promise((resolve) => {
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
                  result.imageId = imageResponse[0].id;
                }
                callback();
              }).catch((imageError) => {
                console.error('Error loading tile image', imageError);
                callback();
              });

            }, () => {
              resolve(results);
            });

          }).catch(listErr => {
            console.error('Error listing tiles', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new TilesApi(kuntaApi);
  };

}).call(this);