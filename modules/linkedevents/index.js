/*jshint esversion: 6 */
(function () {
  'use strict';

  const util = require('util');
  const _ = require('lodash');
  const async = require('async');
  const Promise = require('bluebird');
  const LinkedEventsClient = require('linkedevents-client');
  const config = require('nconf');
  const uuidv4 = require('uuid/v4');
  
  class LinkedEventsApi {

    constructor(parent) {
      this.parent = parent;
      this.initClient();
      this.filterApi = new LinkedEventsClient.FilterApi();
      this.eventApi = new LinkedEventsClient.EventApi();
      this.imageApi = new LinkedEventsClient.ImageApi();
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
      const linkedEventsURL = config.get('linkedevents:api-url');
      
      eventData.keywords = _.map(eventData.keywords||[], (keyword) => {
        return {
          "@id": `${linkedEventsURL}/keyword/${keyword}/`
        };
      });
      
      eventData.location = {
        "@id": `${linkedEventsURL}/place/${eventData.location}/` 
      };
      
      const imageUrlCreates = _.map(eventData['image-urls'], (imageUrl) => {
        const imageObject = LinkedEventsClient.ImageUrl.constructFromObject({
          url: imageUrl
        });
        
        return this.imageApi.imageCreate({
          imageObject: imageObject
        });
      });
      
      eventData['image-urls'] = null;
      
      this.parent.addPromise(Promise.all(imageUrlCreates)
        .then((images) => {
          const event = LinkedEventsClient.Event.constructFromObject(eventData);
      
          event.images = _.map(images, (image) => {
            return {
              "@id": `${linkedEventsURL}/image/${image.id}/`
            };
          });
          
          return this.eventApi.eventCreate({
            eventObject: event
          });
        })
      );
      
      return this.parent;
    }
    
    createPlace(placeData) {
      const linkedEventsURL = config.get('linkedevents:api-url');
      
      const place = LinkedEventsClient.Place.constructFromObject(Object.assign({
        "data_source": this.dataSource,
        "publisher": this.publisher,
        "origin_id": uuidv4(),
        "deleted": false
      }, placeData));
      
      this.parent.addPromise(this.filterApi.placeCreate({
        placeObject: place
      }));
      
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
        showAllKeywords: true,
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