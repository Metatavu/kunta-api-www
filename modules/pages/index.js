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
    
    getContent(pageId, preferLanguages) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.pagesApi.findOrganizationPageContent(this.parent.organizationId, pageId)
          .then(pageContent => {
            if (pageContent) {
              resolve(this.selectBestLocale(pageContent, preferLanguages));
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

    resolvePageTree(pageId) {
      return new Promise((resolve, reject) => {
        this.pagesApi.findOrganizationPage(this.parent.organizationId, pageId)
          .then(page => {
            if (!page) {
              reject(util.format("Could not find page with id %s", pageId));
            } else {
              if (page.parentId) {
                this.resolvePageTree(page.parentId)
                  .then(ancestors => {
                    resolve(ancestors.concat(page));
                  })
                  .catch(parentErr => {
                    reject(parentErr);
                  });
              } else {
                resolve([page]);
              }
            }
        })
        .catch(err => {
          reject(err);
        });
      });
    }
    
    resolveBreadcrumbs(basePath, page, preferLanguages) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        if (!page.parentId) {
          resolve([]);
          return;
        }
        
        this.resolvePageTree(page.parentId)
          .then(pages => {
            var result = [];
            var path = [];
            
            for (var i = 0, l = pages.length; i < l; i++) {
              path.push(pages[i].slug);   
              result.push({
                path: basePath + path.join('/'),
                title: this.selectBestLocale(pages[i].titles, preferLanguages)
              });
            }
            
            resolve(result);
          })
          .catch(err => {
            reject(err);
          });
      }));
      
      return this.parent;
    }
    
    findById(pageId, preferLanguages) { 
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.pagesApi.findOrganizationPage(this.parent.organizationId, pageId)
          .then(page => {
            this.processPage(page, preferLanguages)
              .then(page => resolve(page))
              .catch(err => reject(err));
          })
          .catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
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
              this.processPage(page, preferLanguages)
                .then(page => resolve(page))
                .catch(err => reject(err));
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
    
    listMetaByParentId(parentId, preferLanguages) {
      var options = {
        parentId: parentId ? parentId : 'ROOT'
      };
      
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.pagesApi.listOrganizationPages(this.parent.organizationId, options)
          .then(pages => {
            _.each(pages, page => {
              page.title = this.selectBestLocale(page.titles, preferLanguages);
            });
            
            resolve(pages);
          })
          .catch(listErr => reject(listErr));
      }));

      return this.parent;
    }
    
    selectBestLocale (localized, preferLanguages) {
      var localeContents = _.mapKeys(localized, (item) => {
        return item.language;
      });
      
      var contentLocales = _.keys(localeContents);
      var prefered = _.isArray(preferLanguages) ? preferLanguages : [preferLanguages];
      if (_.indexOf(prefered, 'fi')) {
         prefered.push('fi');
      }

      var bestLocale = (new locale.Locales(prefered)).best(new locale.Locales(contentLocales));
     
      return localeContents[bestLocale] ? localeContents[bestLocale].value : null;
    }
    
    processPage (page, preferLanguages) {
      return new Promise((resolve, reject) => {
        page.title = this.selectBestLocale(page.titles, preferLanguages);
     
        this.pagesApi.listOrganizationPageImages(this.parent.organizationId, page.id)
          .then(imageResponse => {
            var basePath = this.parent.basePath;
            var organizationId = this.parent.organizationId;
            if (imageResponse.length) {
              page.featuredImageSrc = util.format('%s/organizations/%s/pages/%s/images/%s/data', basePath, organizationId, page.id, imageResponse[0].id);
            }
          
            resolve(page);
          })
          .catch(imagesErr => {
            reject(imagesErr);
          });  
      });
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new PagesModule(kuntaApi);
  };
  
}).call(this);