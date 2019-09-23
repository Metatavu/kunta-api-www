/*jshint esversion: 6 */
(function() {
  'use strict';

  var _ = require('lodash');
  var Twitter = require('twitter');
  var FB = require('fb');
  var InstagramAPI = require('instagram-api');
  const RedisCacheService = require('cache-service-redis');

  const FACEBOOK_TOKEN_REFRESH_SLACK = 86400 * 1000; // 24h
  
  class SocialMediaApi {
    
    constructor(parent) {
      this.parent = parent;

      this.accessTokenCache = new RedisCacheService({ 
        redisUrl: this.parent.config.get('cache:redisUrl')
      }); 

      if (this.parent.config.get('twitter')) {
        this.twitter = new Twitter({
          consumer_key: this.parent.config.get('twitter:consumerKey'),
          consumer_secret: this.parent.config.get('twitter:consumerSecret'),
          access_token_key: this.parent.config.get('twitter:accessTokenKey'),
          access_token_secret: this.parent.config.get('twitter:accessTokenSecret')
        });
      }

      FB.options({version: 'v4.0'});

      if (this.parent.config.get('instagram')) {
        this.instagram = new InstagramAPI(this.parent.config.get('instagram:accessToken'));
      }
    }

    latest(count) {
      var sourceCount = (this.parent.config.get('facebook') ? 1 : 0) + 
          (this.parent.config.get('twitter') ? 1 : 0) + 
          (this.parent.config.get('instagram') ? 1 : 0);
      
      if (sourceCount == 0) {
        this.parent.addPromise(new Promise((resolve) => {
          resolve([]);
        }));
      } else {
        var subcount = Math.ceil(count / sourceCount);
        
        this.parent.addPromise(new Promise((resolve, reject) => {
          var calls = [];
          if (this.parent.config.get('facebook')) {
            calls.push(this.facebookLatest(subcount));
          }
          
          if (this.parent.config.get('twitter')) {
            calls.push(this.twitterLatest(subcount));
          }
          
          if (this.parent.config.get('instagram')) {
            calls.push(this.instragramLatest(subcount));
          }
          
          Promise.all(calls)
            .then((results) => {
              resolve(this._sortAndMerge(results));
            }).catch((socialMediaError) => {
              console.error('Error social media items', socialMediaError);
              resolve([]);
            });
        }));
      }
      
      return this.parent;
    }
    
    twitterLatest(count) {
      var options = {
        "screen_name": this.parent.config.get('twitter:screenName'),
        "count": count,
        "trim_user": true,
        "exclude_replies": true
      };
      
      return new Promise((resolve, reject) => {
        this.twitter.get('statuses/user_timeline', options, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.map(result => {
              var idStr = result.id_str;
              return {
                id: result.id,
                created: new Date(result.created_at),
                text: this._htmlifyLinks(result.text),
                source: 'twitter',
                link: 'https://twitter.com/statuses/' + idStr,
                image: result.entities.media ? result.entities.media[0].media_url_https : null,
                tags: result.entities.hashtags.map(function (tag) { return tag.text; })
              };
            }));
          }
        });
      });
    }
    
    /**
     * Lists new posts from Facebook page
     * 
     * @param {Number} count number of posts to list
     * @returns {Promise} a promise for posts from Facebook page
     */
    async facebookLatest (count) {
      const accessToken = await this.getFacebookPageToken();
      if (accessToken) {
        const options = {  
          limit: count,
          access_token: accessToken,
          client_id: this.parent.config.get('facebook:appId'),
          client_secret: this.parent.config.get('facebook:appSecret'),
          fields: [
            'id', 
            'created_time', 
            'message', 
            'full_picture', 
            'message_tags'] 
        };
  
        const result = await this.fbAsync("me/posts", options);
        if(!result || result.error) {
          throw new Error(!result ? 'error occurred' : result.error);
        } else {
          return (result.data||[]).map(post => {
            return {
              id: post.id,
              created: new Date(post.created_time),
              text: this._htmlifyLinks(post.message||post.description),
              source: 'facebook',
              link: 'http://facebook.com/' + post.id,
              image: post.full_picture,
              tags: (post.message_tags||[]).map(function (tag) { return tag.name; })
            };
          });
        }
      } else {
        throw new Error("Failed to retrieve Facebook access token");
      }
    }
    
    instragramLatest (count) {
      var parameters = {
        count: count
      };
      
      return new Promise((resolve, reject) => {
        this.instagram.userMedia(this.parent.config.get('instagram:userId'), parameters)
          .then(result => {
            resolve(result.data.map((item) => {
              return {
                id: item.id,
                created: new Date(parseInt(item.created_time, 10) * 1000),
                text: this._htmlifyLinks(item.caption.text),
                source: 'instagram',
                link: item.link,
                image: item.images.low_resolution.url,
                tags: item.tags
              };
            }));
          })
          .catch(reject);
      });
    }
    
    _sortAndMerge(results) {
      var result = _.flatten(results);
      
      result.sort(function (item1, item2) {
        var created1 = item1.created;
        var created2 = item2.created;
        return created1 > created2 ? -1 : created1 < created2 ? 1 : 0;
      });
      
      return result;
    }
    
    _htmlifyLinks(text) {
      if (!text) {
        return null;
      }
      
      return text.replace(/(https{0,1}:\/\/[a-zA-Z0-9.\/?&=_-]*)/g, 
          '<a href="$1" target="_blank">\$1</a>');
    }

    /**
     * Returns a page access token for a Facebook 
     * 
     * @returns a page access token for a Facebook
     */
    async getFacebookPageToken () {
      let result = await this.getCachedAccessToken("facebook");
      const expires = new Date().getTime() - FACEBOOK_TOKEN_REFRESH_SLACK;
      if (result && result.expires_at > expires) {
        return result.access_token;
      }

      result = await this.getFreshFacebookPageToken(result ? result.access_token : this.parent.config.get('facebook:accessToken'));
      await this.setCachedAccessToken("facebook", result);

      return result.access_token;
    }

    /**
     * Exchanges a Facebook access token to new access token with expire date in future
     * 
     * @param {String} currentAccessToken 
     * @returns {Object} fresh access token
     */
    async getFreshFacebookPageToken (currentAccessToken) {
      const options = {
        client_id: this.parent.config.get('facebook:appId'),
        client_secret: this.parent.config.get('facebook:appSecret'),
        grant_type: 'fb_exchange_token',
        fb_exchange_token: currentAccessToken
      };

      const response = await this.fbAsync("/oauth/access_token", options);
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + (response.expires_in * 1000));

      return {
        access_token: response.access_token,
        expires_at: expiresAt.getTime() 
      };
    }

    /**
     * Stores an access token into a cache.
     * 
     * @param {String} service
     * @param {Object} access token
     * @returns {Promise} Promise for success 
     */
    setCachedAccessToken(service, token) {
      return new Promise((resolve, reject) => {
        this.accessTokenCache.set(service, token, undefined, undefined, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });  
      });
    }

    /**
     * Returns a access token from cache.
     * 
     * @param {String} service
     * @returns {Promise} Promise for an access token or null if not found    
     */
    getCachedAccessToken(service) {
      return new Promise((resolve, reject) => {
        this.accessTokenCache.get(service, (err, value) => {
          if (err) {
            reject(err);
          } else {
            resolve(value);
          }
        });  
      });
    }

    /**
     * Make a call to Facebook Graph API and return a promise as a result 
     * 
     * @param {String} path path 
     * @param {Object} options options
     * @returns {Promise} promise for result from Graph API
     */
    fbAsync (path, options) {
      return new Promise((resolve, reject) => {
        FB.api(path, options, (result) => {
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result);
          }
        });
      });
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new SocialMediaApi(kuntaApi);
  };
  
}).call(this);