/*eslint-env es6*/

(function() {
  'use strict';

  var util = require('util');
  var _ = require('lodash');

  class MenusApi {

    constructor(parent) {
      this.parent = parent;
      this.menusApi = new parent.api.MenusApi();
    }

    list() {
      this.parent.addPromise(new Promise((resolve, reject) => {
        this.menusApi.listOrganizationMenus(this.parent.organizationId)
          .then(menus => {
            var itemPromises = menus.map(menu => {
              return this.menusApi.listOrganizationMenuItems(
                this.parent.organizationId,
                menu.id);
            });

            Promise.all(itemPromises)
              .then(itemResponses => {
                for (var i = 0, l = menus.length; i < l; i++) {
                  var menu = menus[i];
                  menu.items = this.sortByParentId(itemResponses[i]);
                }
                resolve(
                  _.mapKeys(menus, function(menu) {
                    return menu.slug;
                  })
                );
              })
              .catch(itemsErr => {
                reject(itemsErr);
              });
          })
          .catch(listErr => {
            reject(listErr);
          });
      }));

      return this.parent;
    }
    sortByParentId(items) {
      var sortedItems = _.sortBy(items, ['order']);
      var result = [];
      var itemMap = _.mapKeys(sortedItems, function(item) {
        return item.id;
      });
      for (var i = 0; i < sortedItems.length; i++) {
        var item = sortedItems[i];
        if (item.parentId !== null) {
          if (!_.isArray(itemMap[item.parentId].children)) {
            itemMap[item.parentId].children = [];
          }
          itemMap[item.parentId].children.push(item);
        } else {
          result.push(item);
        }

      }
      return result;
    }

  }

  module.exports = function(kuntaApi) {
    return new MenusApi(kuntaApi);
  };

}).call(this);