/*jshint esversion: 6 */
/* global Promise */
(function () {
  'use strict';

  const util = require('util');
  const moment = require('moment');

  class PublicTransportApi {

    constructor(parent) {
      this.parent = parent;
      this.publicTransportApi = new parent.api.PublicTransportApi();
    }

    findAgencyById(id) {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.findOrganizationPublicTransportAgency(this.parent.organizationId, id).then(agency => {
          resolve(agency);
        }).catch(findErr => {
          console.error(util.format('Failed to find agency by id %s', id), findErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    listAgencies() {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportAgencies(this.parent.organizationId)
          .then(agencies => {
            resolve(agencies);
          })
          .catch(listErr => {
            console.error('Error listing agencies', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

    findTripById(id) {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.findOrganizationPublicTransportTrip(this.parent.organizationId, id).then(trip => {
          resolve(trip);
        }).catch(findErr => {
          console.error(util.format('Failed to find trip by id %s', id), findErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    listTrips() {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportTrips(this.parent.organizationId)
          .then(trips => {
            resolve(trips);
          })
          .catch(listErr => {
            console.error('Error listing trips', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }
    
    
    findRouteById(id) {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.findOrganizationPublicTransportRoute(this.parent.organizationId, id).then(route => {
          resolve(route);
        }).catch(findErr => {
          console.error(util.format('Failed to find route by id %s', id), findErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    listRoutes() {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportRoutes(this.parent.organizationId)
          .then(routes => {
            resolve(routes);
          })
          .catch(listErr => {
            console.error('Error listing routes', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }

    findScheduleById(id) {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.findOrganizationPublicTransportSchedule(this.parent.organizationId, id).then(schedule => {
          resolve(schedule);
        }).catch(findErr => {
          console.error(util.format('Failed to find schedule by id %s', id), findErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    listSchedules() {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportSchedules(this.parent.organizationId)
          .then(schedules => {
            resolve(schedules);
          })
          .catch(listErr => {
            console.error('Error listing schedules', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }
    
    findStopsByIds(ids) {
      this.parent.addPromise(new Promise((resolve) => {
        var stopPromises = ids.map((stopId) => {
          return this.publicTransportApi.findOrganizationPublicTransportStop(this.parent.organizationId, stopId);
        });
        Promise.all(stopPromises)
        .then(stops => {
          resolve(stops);
        }).catch(findErr => {
          console.error(util.format('Failed to find stops by ids', findErr));
          resolve([]);
        });
      }));

      return this.parent;
    }

    listStops() {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportStops(this.parent.organizationId)
          .then(stops => {
            resolve(stops);
          })
          .catch(listErr => {
            console.error('Error listing stops', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }
    
    findStopTimeById(id) {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.findOrganizationPublicTransportStopTime(this.parent.organizationId, id).then(stopTime => {
          resolve(stopTime);
        }).catch(findErr => {
          console.error(util.format('Failed to find stopTime by id %s', id), findErr);
          resolve(null);
        });
      }));

      return this.parent;
    }

    listStopTimes() {
      this.parent.addPromise(new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportStopTimes(this.parent.organizationId)
          .then(stopTimes => {
            resolve(stopTimes);
          })
          .catch(listErr => {
            console.error('Error listing stopTimes', listErr);
            resolve([]);
          });
      }));

      return this.parent;
    }
    
    listActiveStopTimesByStopIdsAndDepartureTimeAndDate(stopIds, departureTime, date, sortBy, sortDir, firstResult, maxResults) {
      var activeStopTimePromises = stopIds.map((stopId) => {
        return this._listActiveStopTimesByStopIdAndDepartureTimeAndDate(stopId, departureTime, date, sortBy, sortDir, firstResult, maxResults);
      });
      
      this.parent.addPromise(Promise.all(activeStopTimePromises));
      return this.parent;
    }
    
    _listActiveStopTimesByStopIdAndDepartureTimeAndDate(stopId, departureTime, date, sortBy, sortDir, firstResult, maxResults) {
      var options = {
        stopId: stopId,
        departureTime: departureTime,
        sortBy: sortBy,
        sortDir: sortDir,
        firstResult: firstResult,
        maxResults: maxResults
      };
      return new Promise((resolve) => {
        this.publicTransportApi.listOrganizationPublicTransportStopTimes(this.parent.organizationId, options)
          .then(stopTimes => {

            var tripPromises = stopTimes.map((stopTime) => {
              return this.publicTransportApi.findOrganizationPublicTransportTrip(this.parent.organizationId, stopTime.tripId);
            });
            
            Promise.all(tripPromises)
              .then((trips) => {
                var schedulePromises = trips.map((trip) => {
                  return this.publicTransportApi.findOrganizationPublicTransportSchedule(this.parent.organizationId, trip.scheduleId);
                });
                
                var routePromises = trips.map((trip) => {
                  return this.publicTransportApi.findOrganizationPublicTransportRoute(this.parent.organizationId, trip.routeId);
                });
                
                Promise.all(schedulePromises)
                  .then((schedules) => {
                    Promise.all(routePromises)
                      .then((routes) => {        
                        var results = [];
                
                        for (let i = 0; i < stopTimes.length; i++) {
                          if(this._scheduleIsActive(schedules[i], date)) {
                            results.push({
                              stopTime: stopTimes[i],
                              trip: trips[i],
                              route: routes[i]
                            });
                          }
                        }
                        
                        resolve(results);
                      })
                      .catch((routeErr) => {
                        console.error('Error finding routes', routeErr);
                        resolve([]);
                      });
                  })
                  .catch((scheduleErr) => {
                    console.error('Error finding schedules', scheduleErr);
                    resolve([]);
                  });
              })
              .catch((tripErr) => {
                console.error('Error finding trips', tripErr);
                resolve([]);
              });
          })
          .catch(listErr => {
            console.error('Error listing stopTimes', listErr);
            resolve([]);
          });
      });

    }
    
    _scheduleIsActive(schedule, date) {
      var scheduleStarts = moment(schedule.startDate, moment.ISO_8601);
      var scheduleEnds = moment(schedule.endDate, moment.ISO_8601);
      var seletedDate = moment(date);
      if(seletedDate.isAfter(scheduleStarts) && seletedDate.isBefore(scheduleEnds)) {
        for(let i = 0; i < schedule.exceptions.length; i++) {
          var exception = schedule.exceptions[i];
          if (seletedDate.isSame(moment(exception.date, moment.ISO_8601), 'day')) {
            return exception.type === 'ADD';
          }
        }
        var weekDay = seletedDate.day();
        return schedule.days.indexOf(weekDay) > -1;
      } else {
        return false;
      }
    }
  }

  module.exports = function (kuntaApi) {
    return new PublicTransportApi(kuntaApi);
  };

}).call(this);