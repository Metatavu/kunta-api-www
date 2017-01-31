/*jshint esversion: 6 */
(function() {
  'use strict';
  
  const util = require('util');
  const _ = require('lodash');
  
  class FilesModule {
    
    constructor(parent) {
      this.parent = parent;
      this.filesApi = new parent.api.FilesApi();
    }
    
    streamData(id) {
      var url = util.format('%s/organizations/%s/files/%s/data', this.parent.basePath, this.parent.organizationId, id);
      this.parent.addPromise(this.parent.promiseStream(url));
      return this.parent;
    }
    
    findById(fileId) { 
      this.parent.addPromise(this.filesApi.findOrganizationFile(this.parent.organizationId, fileId));

      return this.parent;
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