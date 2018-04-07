/*jshint esversion: 6 */
(function () {
  'use strict';

  var util = require('util');
  var _ = require('lodash');
  var async = require('async');

  class NewsApi {

    constructor(parent) {
      this.parent = parent;
      this.newsApi = new parent.api.NewsApi();
    }
    
    streamImageData(newsArticleId, imageId, query, headers) {
      var url = util.format('%s/organizations/%s/news/%s/images/%s/data', this.parent.basePath, this.parent.organizationId, newsArticleId, imageId);
      this.parent.addPromise(this.parent.promiseStream(url, query, headers));
      return this.parent;
    }
    
    listByTag(tag) {
      this.parent.addPromise(new Promise((resolve) => {
        this.newsApi.listOrganizationNews(this.parent.organizationId, {
          tag: tag
        }).then(news => {
          var imagePromises = news.map(newsArticle => {
            return this.newsApi.listOrganizationNewsArticleImages(
              this.parent.organizationId,
              newsArticle.id);
          });

          var results = _.cloneDeep(news);

          async.eachOf(results, (result, index, callback) => {
            var imagePromise = imagePromises[index];
            imagePromise.then((imageResponse) => {
              if (imageResponse.length) {
                result.imageId = imageResponse[0].id;
              }
              
              callback();
            }).catch((imageError) => {
              console.error('Error loading news image', imageError);
              callback();
            });

          }, () => {
            resolve(results);
          });
        }).catch(listErr => {
          console.error(util.format('Failed to list news article by tag %s', tag), listErr);
          resolve([]);
        });
      }));

      return this.parent;
    } 

    findBySlug(slug) {
      this.parent.addPromise(new Promise((resolve) => {
        this.newsApi.listOrganizationNews(this.parent.organizationId, {
          slug: slug
        }).then(news => {
          var newsArticle = news[0];
          this.newsApi.listOrganizationNewsArticleImages(
            this.parent.organizationId,
            newsArticle.id
          ).then(newsImages => {
            if (newsImages.length) {
              newsArticle.imageId = newsImages[0].id;
            }
            
            resolve(newsArticle);
          }).catch(imagesErr => {
            console.error('Error loading news image', imagesErr);
            resolve(newsArticle);
          });
        }).catch(listErr => {
          console.error(util.format('Failed to find news article by slug %s', slug), listErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    latest(firstResult, maxResults, sortBy) {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.newsApi.listOrganizationNews(this.parent.organizationId, {
          firstResult: firstResult,
          maxResults: maxResults,
          sortBy: sortBy || 'ORDER_NUMBER_PUBLISHED'
        }).then(news => {
          const imagePromises = news.map(newsArticle => {
            return this.newsApi.listOrganizationNewsArticleImages(
              this.parent.organizationId,
              newsArticle.id);
          });

          const results = _.cloneDeep(news);

          async.eachOf(results, (result, index, callback) => {
            const imagePromise = imagePromises[index];
            imagePromise.then((imageResponse) => {
              if (imageResponse.length) {
                result.imageId = imageResponse[0].id;
              }
              
              callback();
            }).catch((imageError) => {
              console.error('Error loading news image', imageError);
              callback();
            });

          }, () => {
            resolve(results);
          });
        }).catch(listErr => {
          console.error('Error listing news', listErr);
          resolve([]);
        });
      }));

      return this.parent;
    }
    
    search(search, firstResult, maxResults) {
      var options = {
        search: search,
        firstResult: firstResult,
        maxResults: maxResults,
        sortBy: 'SCORE',
        sortDir: 'DESC'
      };
      
      this.parent.addPromise(new Promise((resolve) => {
        this.newsApi.listOrganizationNews(this.parent.organizationId, options)
          .then(news => {
            const imagePromises = news.map(newsArticle => {
              return this.newsApi.listOrganizationNewsArticleImages(
                this.parent.organizationId,
                newsArticle.id);
            });

            const results = _.cloneDeep(news);

            async.eachOf(results, (result, index, callback) => {
              const imagePromise = imagePromises[index];
              imagePromise.then((imageResponse) => {
                if (imageResponse.length) {
                  result.imageId = imageResponse[0].id;
                }

                callback();
              }).catch((imageError) => {
                console.error('Error loading news image', imageError);
                callback();
              });

            }, () => {
              resolve(results);
            });
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
    return new NewsApi(kuntaApi);
  };

}).call(this);