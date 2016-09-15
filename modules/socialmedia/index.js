/*global Promise __dirname:true*/
/*eslint-env es6*/

(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  var Twitter = require('twitter');
  var FB = require('fb');
  
  var config = require(__dirname + '/../../config.json');
  
  class SocialMediaApi {
    
    constructor(parent) {
      this.parent = parent;
      if (config.twitter) {
        this.twitter = new Twitter({
          consumer_key: config.twitter.consumerKey,
          consumer_secret: config.twitter.consumerSecret,
          access_token_key: config.twitter.accessTokenKey,
          access_token_secret: config.twitter.accessTokenSecret
        });
      }
      
      if (config.facebook) {
        FB.setAccessToken(util.format("%s|%s", config.facebook.appId, config.facebook.appSecret));
      }
    }
    
    latest(count) {
      var sourceCount = (config.facebook ? 1 : 0) + (config.twitter ? 1 : 0); 
      if (sourceCount == 0) {
        this.parent.addPromise(new Promise((resolve, reject) => {
          resolve([]);
        }));
      } else {
        var subcount = Math.ceil(count / sourceCount);
        
        this.parent.addPromise(new Promise((resolve, reject) => {
          var calls = [];
          if (config.facebook) {
            calls.push(this.facebookLatest(subcount));
          }
          
          if (config.twitter) {
            calls.push(this.twitterLatest(subcount));
          }
          
          Promise.all(calls)
            .then((results) => {
              resolve(this._sortAndMerge(results));
            })
            .catch(reject);
        }));
      }
      
      return this.parent;
    }
    
    twitterLatest(count) {
      var options = {
        "screen_name": config.twitter.screenName,
        "count": count,
        "trim_user": true,
        "exclude_replies": true
      };
      
      return new Promise((resolve, reject) => {
        this.twitter.get('statuses/user_timeline', options, (err, result, pallo) => {
          if (err) {
            reject(err);
          } else {
            resolve(result.map(result => {
              return {
                id: result.id,
                created: new Date(result['created_at']),
                text: this._htmlifyLinks(result.text),
                source: 'twitter',
                link: 'https://twitter.com/statuses/' + result.id_str,
                image: result.entities.media ? result.entities.media[0].media_url_https : null,
                tags: result.entities.hashtags.map(function (tag) { return tag.text; })
              };
            }));
          }
        });
      });
    }
    
    facebookLatest (count) {
      var fields = ['id', 'created_time', 'message', 'description', 'full_picture', 'message_tags' ] ;
      var options = {  
        limit: count, 
        fields: fields 
      };
      
      return new Promise((resolve, reject) => {
        FB.api(util.format('%s/posts', config.facebook.username), options, (result) => {
          if(!result || result.error) {
            reject(!result ? 'error occurred' : result.error);
          } else {
            resolve((result.data || []).map(post => {
              return {
                id: post.id,
                created: new Date(post['created_time']),
                text: this._htmlifyLinks(post.message||post.description),
                source: 'facebook',
                link: 'http://facebook.com/' + post.id,
                image: post['full_picture'],
                tags: (post['message_tags']||[]).map(function (tag) { return tag.name; })
              };
            }));
          }
        });
      });
    }
    
    _sortAndMerge(results) {
      var result = _.flatten(results);
      
      result.sort(function (item1, item2) {
        return item1 > item2 ? -1 : item1 < item2 ? 1 : 0;
      });
      
      return result;
    }
    
    _htmlifyLinks(text) {
      if (!text) {
        return null;
      }
      
      return text.replace(/(https{0,1}:\/\/[a-zA-Z0-9.\/?&=_-]*)/g, '<a href="$1" target="_blank">\$1</a>');
    }
    
  }
  
  module.exports = function (kuntaApi) {
    return new SocialMediaApi(kuntaApi);
  };
  
}).call(this);