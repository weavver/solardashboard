
exports.init = function (global) {
     exports.pollMate3 = function (recordData) {
          global.needle.get(global.config.outbackUrl, function (error, response) {
               if (error) {
                    global.data.outback_data = { 'status': 'error trying to get data from the mate3', error: error };
                    return;
               }

               if (response.body && response.body.devstatus && response.body.devstatus.ports && response.body.devstatus.ports.length > 2) {
                    global.data.outback_data = response.body;

                    var charge_watts = null;
                    var consumption_watts = null;
                    var pv_kwh = 0;
                    global.data.outback_data.buy_watts = 0;

                    response.body.devstatus.ports.forEach(function (device, key, array) {
                         if (device.Dev == 'FXR') {
                              var inv = device;
                              consumption_watts += (inv.Inv_I_L2 * inv.VAC_out_L2) + ((inv.Buy_I_L2 * inv.VAC_out_L2) - (inv.Chg_I_L2 * inv.VAC1_in_L2));
                              global.data.outback_data.buy_watts += (inv.Buy_I_L2 * inv.VAC1_in_L2);
                              charge_watts += inv.Chg_I_L2 * inv.VAC1_in_L2;
                         }
                         if (device.Dev == 'CC')
                         {
                              var cc = device;
                              if (typeof cc !== 'undefined' && typeof cc.Out_I !== 'undefined' && typeof cc.Batt_V !== 'undefined') {
                                   var a = cc.Out_I * cc.Batt_V;
                                   global.data.outback_data.pv_watts = Math.round(a / 10) * 10;
                                   pv_kwh += cc.Out_kWh;
                              }
                         }
                         if (device.Dev == 'FNDC') {
                              global.data.outback_data.fndc = device;
                              global.data.outback_data.soc = device.SOC;
                              global.data.outback_data.kwh_net = device.Net_CFC_kWh;
                         }
                    });

                    global.data.outback_data.pv_kwh = pv_kwh;
                    global.data.outback_data.inv_in = charge_watts;
                    global.data.outback_data.inv_out = consumption_watts;

                    //if (recordData)
                    //     exports.logData();
               }
               else {
                    global.data.outback_data = { 'status': 'error reading the response from the mate3' };
               }
          });
     };

     exports.getHistory = function(task, callback) {
          console.log('loading history for sensor: ' + task.sensorId);

          var searchDateObj = new Date();
          searchDateObj.setHours(searchDateObj.getHours() - 6);
          debugger;
          global.nedb
               .find({
                    sensorId: task.sensorId,
                    timestamp_unix: { $gt: searchDateObj.getTime() }
               })
               .sort({ timestamp_unix: 1})
               .exec(function (err, docs) {
                    debugger;
                    //console.log('found ' + docs.length + ' matching docs');

                    var reducedDocs = [];
                    var count = 0;
                    var redval = 0;
                    var lastItemHour = null;
                    var lastItemMinute = -1;
                    var lastItemCount = 0;
                    var aggregateValSum = null;
                    var itemCount = 0;
                    docs.forEach(function (element, index, array) {
                         var itemDateTime = new Date(element.timestamp_unix);
                         var itemHour = itemDateTime.getHours();
                         var itemMinute = itemDateTime.getMinutes();
                         var itemSecond = itemDateTime.getSeconds();

                         if (lastItemMinute == -1)
                              lastItemMinute = itemMinute;

                         aggregateValSum += element.value;

                         if (itemHour != lastItemHour || itemMinute != lastItemMinute || index == docs.length - 1) {
                              var average = aggregateValSum / itemCount;
                              average = +(Math.round(average + ("e+" + task.precision)) + ("e-" + task.precision));

                              var copiedDateTime = new Date(itemDateTime.getTime());
                              copiedDateTime.setSeconds(0, 0);
                              var aggregatedDoc = {
                                   timestamp_unix: copiedDateTime.getTime(),
                                   value: average,
                                   sensorId: element.sensorId,
                                   timestamp: copiedDateTime
                              };
                              reducedDocs.push(aggregatedDoc);

                              //console.log('end! count: ' + itemCount + ' -- avg: ' + average);

                              // reset counters
                              aggregateValSum = 0;
                              itemCount = 0;
                         }
                         itemCount++;
                         //console.log(itemDateTime.toISOString().slice(0, 19) + '  --- last minute: ' + lastItemMinute + ' val: ' + element.value + ': count is ' + itemCount);

                         redval += element.value;

                         lastItemHour = itemHour;
                         lastItemMinute = itemMinute;
                    });

                    //console.log('reduced to ' + reducedDocs.length + ' documents');
                    //global.data_history[task.sensorId] = reducedDocs;

                    global.MongoClient.connect(global.config.mongo_url, function(err, db) {
                         if (err) {
                              console.log(err);
                              return;
                         }
                         var sensordata = db.collection('sensordata');
                         sensordata.aggregate(
                              [
                                   {
                                        $project: {
                                             "sensorId": "$sensorId",
                                             "y": {"$year": "$timestamp" },
                                             "m": {"$month": "$timestamp"},
                                             "d": {"$dayOfMonth": "$timestamp"},
                                             "h": {"$hour": "$timestamp"},
                                             "min": {"$minute": '$timestamp'},
                                             //"datetime": { $dateToString: { format: "%m-%d-%Y %H:%M:00 UTC", date:
                                             // "$timestamp" } },
                                             "value": '$value'
                                        }
                                   },
                                   {$match: {sensorId: task.sensorId}},
                                   {
                                        $group: {
                                             _id: {
                                                  'sensorId': '$sensorId',
                                                  //'datetime': '$datetime'
                                                  'year': '$y',
                                                  'month': '$m',
                                                  'day': '$d',
                                                  'hour': '$h',
                                                  'min': '$min',
                                             },
                                             total: {
                                                  $avg: '$value'
                                             }
                                        }
                                   },
                                   { $sort : { "_id" : -1 } },
                                   { $limit : 500 }
                              ])
                              .toArray(function (err, docs) {
                                   console.log(docs);
                                   global.data_history[task.sensorId] = docs;
                                   db.close();
                                   callback();
                              });
                    });
               });
     };

     exports.getHistory = function(task, callback) {
          console.log('loading history for sensor: ' + task.sensorId);

          var searchDateObj = new Date();
          searchDateObj.setHours(searchDateObj.getHours() - 6);
          debugger;
          global.nedb
               .find({
                    sensorId: task.sensorId,
                    timestamp_unix: {$gt: searchDateObj.getTime()}
               })
               .sort({timestamp_unix: 1})
               .exec(function (err, docs) {
                    debugger;
                    //console.log('found ' + docs.length + ' matching docs');

                    var reducedDocs = [];
                    var count = 0;
                    var redval = 0;
                    var lastItemHour = null;
                    var lastItemMinute = -1;
                    var lastItemCount = 0;
                    var aggregateValSum = null;
                    var itemCount = 0;
                    docs.forEach(function (element, index, array) {
                         var itemDateTime = new Date(element.timestamp_unix);
                         var itemHour = itemDateTime.getHours();
                         var itemMinute = itemDateTime.getMinutes();
                         var itemSecond = itemDateTime.getSeconds();

                         if (lastItemMinute == -1)
                              lastItemMinute = itemMinute;

                         aggregateValSum += element.value;

                         if (itemHour != lastItemHour || itemMinute != lastItemMinute || index == docs.length - 1) {
                              var average = aggregateValSum / itemCount;
                              average = +(Math.round(average + ("e+" + task.precision)) + ("e-" + task.precision));

                              var copiedDateTime = new Date(itemDateTime.getTime());
                              copiedDateTime.setSeconds(0, 0);
                              var aggregatedDoc = {
                                   timestamp_unix: copiedDateTime.getTime(),
                                   value: average,
                                   sensorId: element.sensorId,
                                   timestamp: copiedDateTime
                              };
                              reducedDocs.push(aggregatedDoc);

                              //console.log('end! count: ' + itemCount + ' -- avg: ' + average);

                              // reset counters
                              aggregateValSum = 0;
                              itemCount = 0;
                         }
                         itemCount++;
                         //console.log(itemDateTime.toISOString().slice(0, 19) + '  --- last minute: ' + lastItemMinute + ' val: ' + element.value + ': count is ' + itemCount);

                         redval += element.value;

                         lastItemHour = itemHour;
                         lastItemMinute = itemMinute;
                    });

                    //console.log('reduced to ' + reducedDocs.length + ' documents');
                    //global.data_history[task.sensorId] = reducedDocs;

                    global.MongoClient.connect(global.config.mongo_url, function (err, db) {
                         if (err) {
                              console.log(err);
                              return;
                         }
                         var sensordata = db.collection('sensordata');
                         sensordata.aggregate(
                              [
                                   {
                                        $project: {
                                             "sensorId": "$sensorId",
                                             "y": {"$year": "$timestamp"},
                                             "m": {"$month": "$timestamp"},
                                             "d": {"$dayOfMonth": "$timestamp"},
                                             "h": {"$hour": "$timestamp"},
                                             "min": {"$minute": '$timestamp'},
                                             //"datetime": { $dateToString: { format: "%m-%d-%Y %H:%M:00 UTC", date:
                                             // "$timestamp" } },
                                             "value": '$value'
                                        }
                                   },
                                   {$match: {sensorId: task.sensorId}},
                                   {
                                        $group: {
                                             _id: {
                                                  'sensorId': '$sensorId',
                                                  //'datetime': '$datetime'
                                                  'year': '$y',
                                                  'month': '$m',
                                                  'day': '$d',
                                                  'hour': '$h',
                                                  'min': '$min',
                                             },
                                             total: {
                                                  $avg: '$value'
                                             }
                                        }
                                   },
                                   {$sort: {"_id": -1}},
                                   {$limit: 500}
                              ])
                              .toArray(function (err, docs) {
                                   console.log(docs);
                                   global.data_history[task.sensorId] = docs;
                                   db.close();
                                   callback();
                              });
                    });
               });
     };

     setInterval(function() { exports.pollMate3(true) }, 1000);
     //setInterval(function() { global.outback.loadHistory() }, 15000);

     //exports.loadHistory();
};