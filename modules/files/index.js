/*jshint esversion: 6 */
(function() {
  'use strict';
  
  const _ = require('lodash');
  
  class FilesModule {
    
    constructor(parent) {
      this.parent = parent;
      this.filesApi = new parent.api.FilesApi();
    }
    
    search(search) {
      var options = {
        search: search
      };
      
      this.parent.addPromise(new Promise((resolve) => {
        this.filesApi.listOrganizationFiles(this.parent.organizationId, options)
          .then(files => {
            _.each(files, file => {
              file.title = file.title||file.slug;
            });
            
            resolve(files);
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
    return new FilesModule(kuntaApi);
  };
  
}).call(this);