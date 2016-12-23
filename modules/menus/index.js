/*eslint-env es6*/

(function () {
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
                this.resolveAllItemPaths(menus)
                  .then(() => {
                    resolve(_.mapKeys(menus, function (menu) {
                      return menu.slug;
                    }));
                  })
                  .catch(itemErr => reject(itemErr))
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

    resolveAllItemPaths(menus) {
      return Promise.all(menus.map(menu => {
        return this.resolveItemPaths(menu);
      }));
    }

    resolveItemPaths(menu) {
      return Promise.all(menu.items.map(item => {
        return this.resolveUrl(item);
      }));
    }

    resolveUrl(item) {
      return new Promise((resolve, reject) => {
        if (item.externalUrl) {
          resolve(_.assignIn(item, {
            url: item.externalUrl
          }));
        } else if (item.pageId) {
          this.parent.pages.resolvePageTree(item.pageId)
            .then(tree => {
              var url = '/' + _.map(tree, function (item) {
                return item.slug;
              }).join('/');
              resolve(_.assignIn(item, {
                url: url
              }));
            })
            .catch(err => reject(err));
        } else {
          resolve(_.assignIn(item, {
            url: '#'
          }));
        }
      });
    }

    sortByParentId(items) {
      var sortedItems = _.sortBy(items, ['order']);
      _.each(sortedItems, (item) => {
        item.children = [];
      });

      var result = [];
      var itemMap = _.mapKeys(sortedItems, (item) => {
        return item.id;
      });

      for (var i = 0; i < sortedItems.length; i++) {
        var item = sortedItems[i];
        if (item.parentItemId) {
          var parentItem = itemMap[item.parentItemId];
          if (parentItem) {
            if (!parentItem.children) {
              itemMap[item.parentItemId].children = [];
            }

            itemMap[item.parentItemId].children.push(item);
          } else {
            console.error(util.format("Could not find parentItem with id %s", item.parentItemId));
          }
        } else {
          result.push(item);
        }

      }
      return result;
    }

  }

  module.exports = function (kuntaApi) {
    return new MenusApi(kuntaApi);
  };

}).call(this);