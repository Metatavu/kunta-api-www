(function() {
  'use strict';
  
  var util = require('util');
  var _ = require('lodash');
  var Twitter = require('twitter');
  var FB = require('fb');
  var InstagramAPI = require('instagram-api');
  
  class SocialMediaApi {
    
    constructor(parent) {
      this.parent = parent;
      if (this.parent.config.get('twitter')) {
        this.twitter = new Twitter({
          consumer_key: this.parent.config.get('twitter:consumerKey'),
          consumer_secret: this.parent.config.get('twitter:consumerSecret'),
          access_token_key: this.parent.config.get('twitter:accessTokenKey'),
          access_token_secret: this.parent.config.get('twitter:accessTokenSecret')
        });
      }
      
      if (this.parent.config.get('facebook')) {
        FB.setAccessToken(util.format("%s|%s", this.parent.config.get('facebook:appId'), this.parent.config.get('facebook:appSecret')));
      }
      
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
            })
            .catch(reject);
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
    
    facebookLatest (count) {
      var options = {  
        limit: count, 
        fields: [
          'id', 
          'created_time', 
          'message', 
          'description', 
          'full_picture', 
          'message_tags'] 
      };
      
      return new Promise((resolve, reject) => {
        FB.api(util.format('%s/posts', this.parent.config.get('facebook:username')), options, (result) => {
          if(!result || result.error) {
            reject(!result ? 'error occurred' : result.error);
          } else {
            resolve((result.data||[]).map(post => {
              return {
                id: post.id,
                created: new Date(post.created_time),
                text: this._htmlifyLinks(post.message||post.description),
                source: 'facebook',
                link: 'http://facebook.com/' + post.id,
                image: post.full_picture,
                tags: (post.message_tags||[]).map(function (tag) { return tag.name; })
              };
            }));
          }
        });
      });
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
    
  }
  
  module.exports = function (kuntaApi) {
    return new SocialMediaApi(kuntaApi);
  };
  
}).call(this);