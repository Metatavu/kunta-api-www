/*jshint esversion: 6 */
(function() {
  'use strict';
  
  const util = require('util');
  const _ = require('lodash');
  const request = require('request');
  const fs = require('fs');
  const Promise = require('bluebird');
  
  class PagesModule {
    
    constructor(parent) {
      this.parent = parent;
      this.pagesApi = new parent.api.PagesApi();
    }
    
    streamImageData(pageId, imageId, query, headers) {
      var url = util.format('%s/organizations/%s/pages/%s/images/%s/data', this.parent.basePath, this.parent.organizationId, pageId, imageId);
      this.parent.addPromise(this.parent.promiseStream(url, query, headers));
      return this.parent;
    }
    
    listImages(pageId) {
      this.parent.addPromise(new Promise((resolve) => {
        this.pagesApi.listOrganizationPageImages(this.parent.organizationId, pageId)
          .then(images => {
            resolve(images);
          });
      }));
      
      return this.parent;
    }
    
    getContent(pageId, preferLanguages) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.pagesApi.findOrganizationPageContent(this.parent.organizationId, pageId)
          .then(pageContent => {
            if (pageContent) {
              resolve(this.parent.selectBestLocale(pageContent, preferLanguages));
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
    
    readMenuTree(rootId, leafId, preferLanguages) {
      var opts = function (parentId) {
        return {
          parentId: parentId ? parentId : 'ROOT',
          sortBy: 'MENU'
        };
      };
      
      this.parent.addPromise(new Promise((resolve, reject) => {
        if (rootId === leafId) {
          resolve([]);
          return;
        } 
        
        this.resolvePageTree(rootId, leafId)
          .then(treeNodes => {
            var promises = _.map(treeNodes, (treeNode) => {
              return new Promise((metaResolve, metaReject) => {
                this.pagesApi.listOrganizationPages(this.parent.organizationId, opts(treeNode.id))
                  .then(pages => {
                    var childPromises = _.map(pages, (page) => {
                      if (page.meta && page.meta.hideMenuChildren) {
                        return new Promise((resolve) => {
                          resolve([]);
                        });
                      } else {
                        return this.pagesApi.listOrganizationPages(this.parent.organizationId, opts(page.id));
                      }
                    });
                    
                    _.each(pages, page => {
                      page.title = this.parent.selectBestLocale(page.titles, preferLanguages);
                    });
                    
                    Promise.all(childPromises)
                      .then((children) => {
                        for (var i = 0; i < children.length; i++) {
                          pages[i].hasChildren = children[i].length > 0;
                        }
                        
                        metaResolve(pages);
                      })
                      .catch(childErr => metaReject(childErr));
                  })
                  .catch(listErr => metaReject(listErr));  
              });
            });
            
            Promise.all(promises)
              .then(resolve)
              .catch(reject);
          })
          .catch(err => {
            console.error(util.format("Failed to resolvePageTree %s", err));
            resolve([]);
          });
      }));
      
      return this.parent;
    }

    resolvePageTree(rootId, leafId) {
      return new Promise((resolve, reject) => {
        this.pagesApi.findOrganizationPage(this.parent.organizationId, leafId)
          .then(page => {
            if (!page) {
              reject(util.format("Could not find page with id %s", leafId));
            } else {
              if (page.parentId && page.parentId !== rootId) {
                this.resolvePageTree(rootId, page.parentId)
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
          console.error(util.format("Could not resolve breadcrumbs because page %s parent is null", page.id));
          resolve([{
            id: page.id,
            path: basePath + '/' + page.slug,
            title: page.title
          }]);
          return;
        }
        
        this.resolvePageTree(null, page.parentId)
          .then(pages => {
            var result = [];
            var path = [];
            
            for (var i = 0, l = pages.length; i < l; i++) {
              path.push(pages[i].slug);   
              result.push({
                id: pages[i].id,
                path: basePath + '/' + path.join('/'),
                title: this.parent.selectBestLocale(pages[i].titles, preferLanguages)
              });
            }
            
            result.push({
              id: page.id,
              path: path.join('/') + '/' + page.slug,
              title: page.title
            });
            
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
        parentId: parentId ? parentId : 'ROOT',
        sortBy: 'MENU'
      };
      
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.pagesApi.listOrganizationPages(this.parent.organizationId, options)
          .then(pages => {
            _.each(pages, page => {
              page.title = this.parent.selectBestLocale(page.titles, preferLanguages);
            });
            
            resolve(pages);
          })
          .catch(listErr => reject(listErr));
      }));

      return this.parent;
    }
    
    processPage (page, preferLanguages) {
      return new Promise((resolve) => {
        page.title = this.parent.selectBestLocale(page.titles, preferLanguages);
        resolve(page);
      });
    }
    
    resolvePath (pageId) {
      this.parent.addPromise(new Promise((resolve) => {
        this.resolvePageTree(null, pageId)
        .then(pages => {
          var path = pages.map((page) => {
            return page.slug;
          });
          
          resolve(path.join('/'));
        })
        .catch(err => {
          console.error(util.format('failed to resolve path for page %s', pageId), err);
          resolve(null);
        });
      }));
      
      return this.parent;
    }
    
    /**
     * Lists events from Kunta API
     * 
     * @param {Object} options request options
     * @return {Object} parent object
     */
    search(options, preferLanguages) {
      if (arguments.length > 2) {
        // Support for old deprecated version of the method
        return this.search({
          search: arguments[0],
          firstResult: arguments[2],
          maxResults: arguments[3],
          sortBy: 'SCORE',
          sortDir: 'ASC'
        }, arguments[1]);
      }

      this.parent.addPromise(new Promise((resolve) => {
        this.pagesApi.listOrganizationPages(this.parent.organizationId, options)
        .then(pages => {
          _.each(pages, page => {
            page.title = this.parent.selectBestLocale(page.titles, preferLanguages);
          });
          resolve(pages);
        })
        .catch(listErr => {
          console.error(listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new PagesModule(kuntaApi);
  };
  
}).call(this);