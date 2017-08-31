/*jshint esversion: 6 */
(function () {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const async = require('async');
  const Promise = require('bluebird');
  const LinkedEventsClient = require('linkedevents-client');
  const config = require('nconf');
  
  class LinkedEventsApi {

    constructor(parent) {
      this.parent = parent;
      this.initClient();
      this.filterApi = new LinkedEventsClient.FilterApi();
      this.eventApi = new LinkedEventsClient.EventApi();
    }
    
    initClient () {
      const apiKey = config.get('linkedevents:api-key');
      const apiUrl = config.get('linkedevents:api-url');
      const client = LinkedEventsClient.ApiClient.instance;
      
      client.defaultHeaders = {
        apikey: apiKey
      };
      
      client.basePath = apiUrl;
      
      this.dataSource = config.get('linkedevents:datasource');
      this.publisher = config.get('linkedevents:publisher');
    }
    
    createEvent(eventData) {
      console.log(eventData);
      const event = LinkedEventsClient.Event.constructFromObject(eventData);
      console.log(event);
      
      const options = {
        eventObject: event
      };
      
      this.parent.addPromise(this.eventApi.eventCreate(options));
      return this.parent;
    }
    
    searchPlaces(text, page, pageSize) {
      const options = {
        showAllPlaces: true,
        text: text,
        dataSource: this.dataSource,
        page: page,
        pageSize: pageSize
      };
      
      this.parent.addPromise(this.filterApi.placeList(options));
      return this.parent;
    }
    
    searchKeywords(text, page, pageSize) {
      const options = {
        showAllPlaces: true,
        text: text,
        dataSource: this.dataSource,
        page: page,
        pageSize: pageSize
      };
      
      this.parent.addPromise(this.filterApi.keywordList(options));
      return this.parent;
    }

  }

  module.exports = function (kuntaApi) {
    return new LinkedEventsApi(kuntaApi);
  };

}).call(this);