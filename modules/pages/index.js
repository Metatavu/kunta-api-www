/*eslint-env es6*/
(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  var locale = require('locale');
  
  class PagesModule {
    
    constructor(parent) {
      this.parent = parent;
      this.pagesApi = new parent.api.PagesApi();
    }
    
    findByPath(path, preferLanguages) { 
      var options = {
        path: path
      };
      
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.pagesApi.listOrganizationPages(this.parent.organizationId, options)
          .then(pages => {
            var page = pages && pages.length ? pages[0] : null;
            if (page) {
              page.title = this.selectBestLocale(page.titles, preferLanguages);
              page.contents = this.selectBestLocale(page.contents, preferLanguages);
              
              this.pagesApi.listOrganizationPageImages(this.parent.organizationId, page.id)
                .then(imageResponse => {
                  var basePath = this.parent.basePath;
                  var organizationId = this.parent.organizationId;
                  if (imageResponse.length) {
                    page.featuredImageSrc = util.format('%s/organizations/%s/pages/%s/images/%s/data', basePath, organizationId, page.id, imageResponse[0].id);
                  }
                  
                  console.log(page);
                  
                  resolve(page);
                })
                .catch(imagesErr => {
                  reject(imagesErr);
                });  
            } else {              
              resolve(null);
            }
          })
          .catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
    }
    
    selectBestLocale (localied, preferLanguages) {
      var localeContents = _.mapKeys(localied, (item) => {
        return item.language;
      });
      var contentLocales = _.keys(localeContents);
      var bestLocale = (new locale.Locales(preferLanguages, 'fi')).best(new locale.Locales(contentLocales));
      return localeContents[bestLocale] ? localeContents[bestLocale].value : null;
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new PagesModule(kuntaApi);
  };
  
}).call(this);