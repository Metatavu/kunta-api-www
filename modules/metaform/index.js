/*jshint esversion: 6 */
(() => {
  'use strict';

  const request = require('request');
  const config = require('nconf');

  class MetaformModule {

    constructor(parent) {
      this.parent = parent;
    }
    
    createReply(metaformId, data) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        request.post(`${config.get('metaform:api-url')}wp/v2/metaforms/${metaformId}/replies`, {
          'json': data,
          'auth': {
            'user': config.get('metaform:username'),
            'pass': config.get('metaform:password'),
            'sendImmediately': true
          }
        },function (error, response, body) {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
      }));

      return this.parent;
    }

  }

  module.exports = MetaformModule;

})();