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
                  var basePath = this.parent.basePath;
                  var organizationId = this.parent.organizationId;
                  if (imageResponse.length) {
                    var imageId = imageResponse[0].id;
                    var tileId = result[i].id;
                    
                    result[i].imageSrc = 
                        util.format('%s/organizations/%s/tiles/%s/images/%s/data', 
                        basePath, organizationId, tileId, imageId);
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
    
  }
  
  module.exports = function (kuntaApi) {
    return new TilesApi(kuntaApi);
  };
  
}).call(this);