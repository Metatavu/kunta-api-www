/*eslint-env es6*/

(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  
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
            
            Promise.all(imagePromises)
              .then(imageResponses => {
                var result = _.clone(tiles);
                
                for (var i = 0, l = result.length; i < l; i++) {
                  var imageResponse = imageResponses[i];
                  if (imageResponse.length) {
                    result[i].imageSrc = this.getImageUrl(result[i].id, 
                        imageResponse[0].id);
                  }
                }
                
                resolve(result);
              })
              .catch(imagesErr => {
                reject(imagesErr);
              });
          })
          .catch(listErr => {
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