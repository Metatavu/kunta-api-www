/*jshint esversion: 6 */
/* global __dirname */

(function() {
  'use strict';
  
  const KuntaApiClient = require('kunta-api-client');
  const config = require('nconf');
  const superAgentLogger = require('superagent-logger')({ outgoing: true });
  const RedisCacheService = require('cache-service-redis');
  
  const requestCache = new RedisCacheService({ 
    defaultExpiration: config.get('cache:request:defaultExpiration'),
    redisUrl: config.get('cache:redisUrl')
  });
  const failsafeCache = new RedisCacheService({ 
    defaultExpiration: config.get('cache:failsafe:defaultExpiration'),
    redisUrl: config.get('cache:redisUrl')
  });
  
  const superagentCache = require('superagent-cache-plugin')(requestCache);

  module.exports = function (opts) {
    var clientInstance = KuntaApiClient.ApiClient.instance;
    if (opts.basePath) { 
      clientInstance.basePath = opts.basePath;
    }
    
    if (opts.defaultHeaders) {
      clientInstance.defaultHeaders = opts.defaultHeaders;
    }
    
    clientInstance.failsafeCache = failsafeCache;
    
    clientInstance.beforeRequest = (request, superagent) => {
      request.use(superAgentLogger);
      request.use(superagentCache);
    };
    
    return KuntaApiClient;
  };

}).call(this);