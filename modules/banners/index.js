(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  
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
            
            Promise.all(imagePromises)
              .then(imageResponses => {
                var result = _.clone(banners);
                
                for (var i = 0, l = result.length; i < l; i++) {
                  var imageResponse = imageResponses[i];
                  var basePath = this.parent.basePath;
                  var organizationId = this.parent.organizationId;
                  var imageSrc = imageResponse.length 
                    ? util.format('%s/organizations/%s/banners/%s/images/%s/data', basePath, organizationId, result[i].id, imageResponse[0].id) 
                    : null;
                    result[i].imageSrc = imageSrc;
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
    return new BannersApi(kuntaApi);
  };
  
}).call(this);