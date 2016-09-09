(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  
  class NewsApi {
    
    constructor(parent) {
      this.parent = parent;
      this.newsApi = new parent.api.NewsApi();
    }
    
    latest(firstResult, maxResults) { 
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.newsApi.listOrganizationNews(this.parent.organizationId, {
            firstResult: firstResult,
            maxResults: maxResults
          })
          .then(news => {
            var imagePromises = news.map(newsArticle => {
              return this.newsApi.listOrganizationNewsArticleImages(
                  this.parent.organizationId, 
                  newsArticle.id);
            });
            
            Promise.all(imagePromises)
              .then(imageResponses => {
                var result = _.cloneDeep(news);
                
                for (var i = 0, l = result.length; i < l; i++) {
                  var imageResponse = imageResponses[i];
                  var basePath = this.parent.basePath;
                  var organizationId = this.parent.organizationId;
                  var newsArticleId = result[i].id;
                 
                  var imageSrc = imageResponse.length 
                    ? util.format('%s/organizations/%s/news/%s/images/%s/data', basePath, organizationId, newsArticleId, imageResponse[0].id) 
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
    return new NewsApi(kuntaApi);
  };
  
}).call(this);