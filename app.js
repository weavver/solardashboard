
// check user config exists
var fs = require('fs');
try {
     if (!fs.existsSync('./config.js')) {
          console.log('ERROR: Weavver Solar Dashboard - config does not exist. please copy config.sample.js to config.js and set your values');
          process.exit(1);
     }
}
catch (e) { }

var global = {};

global.result = {};
global.tpl_data = { extra_scripts: 'no script' };
global.config = require('./config');
global.async = require('async');
global.sql = require('mssql');
global.express = require('express');
global.app = global.express();
global.needle = require('needle');
global.jsdom = require("jsdom");
global.nedbDatastore = require('nedb');
global.path = require('path');
global.dbpath = global.path.join('/tmp/', 'mydashboard.db');

console.log('NEDB Path: ' + global.dbpath);
global.nedb = new global.nedbDatastore({ filename: global.dbpath, autoload: true });


global.express.static.mime.define({ 'text/css': ['css'] });

global.app.use(global.express.static('public'));
global.app.use('/bower_components', global.express.static('bower_components'));

var server = global.app.listen(80, function () {
     var host = server.address().address;
     var port = server.address().port;

     console.log('Example app listening at http://%s:%s', host, port);
});

var outbackData = {};

global.app.set('views', './views'); // specify the views directory
global.app.set('view engine', 'tpl'); // register the template engine
global.app.engine('tpl', function (filePath, options, callback) { // define the template engine
     fs.readFile(filePath, function (err, content) {
          if (err) return callback(new Error(err));
          // this is an extremely simple template engine
          var rendered = content.toString()
               .replace('#title#', '<title>' + options.title + '</title>')
               .replace('#extra_scripts#', options.extra_scripts);
          return callback(null, rendered);
     })
});

global.app.get('/', function (req, res) {
     res.render('index', global.tpl_data);
});

global.app.get('/data', function (req, res) {
     res.send(global.result);
});

global.app.get('/data_log', function (req, res) {
     global.nedb
          .find({})
          .sort({ sensorId: 1, timestamp_unix: -1})
          .exec(function (err, docs) {
               res.send(docs);
          });
});

var pushMessagesQueue = global.async.queue(function (task, callback) {
     console.log(task);
     var connection = new global.sql.Connection(global.config, function (err) {
          console.log(err);
          var request = new global.sql.Request(connection); // or: var request = connection.request();
          request.input('orgId', global.sql.VarChar, global.config.orgId);
          request.input('sensorId', global.sql.VarChar, task.sensorId);
          request.input('val', global.sql.VarChar, task.val);
          request.input('recordedAt', global.sql.VarChar, task.date);

          var sql2 = "BEGIN \
               --	   IF NOT EXISTS (SELECT top 1 * FROM Sensors_Data where RecordedAt > DateADD(s, -1, GETUTCDATE()) and SensorId=@sensorId) \
               --	   BEGIN \
                              insert into Sensors_Data (id, organizationid, sensorid, value, recordedat) values(newid(), @orgId, @sensorId, @val, GETUTCDATE()) \
                         select 'inserted' \
               --	   END \
                   END";

          sql2 = "BEGIN \
                    insert into Sensors_Data (id, organizationid, sensorid, value, recordedat) values(newid(), @orgId, @sensorId, @val, @recordedAt) \
                    select 'inserted' \
               END";

          request.batch(sql2, function (err, recordset) {
               if (err) {
                    console.log(err);
               } else if (recordset && recordset.length > 0) {
                    // console.log('Recorded sensor ' + sensorId + ' value ' + val);
                    //console.log('message pushed');
                    //console.log(element);
                    global.nedb.remove({_id: task._id});
               }
               connection.close();
               callback();
          });
     });
}, 1);


function loadHistory() {
     console.log(new Date().getTime());

     var count = 0;
     var d2 = new Date();
     console.log(d2.getTime());

     //("2015/11/12");
     d2.setHours(d2.getHours() - 1);
     console.log(d2.getTime());

     global.nedb
          .find({recordedAt: {$gt: d2.getTime()}})
          .exec(function (err, docs) {


               console.log(docs.length);

               docs.forEach(function (element, index, array) {
                    count++;
                    //console.log(element.sensorId);

                    //var date = new Date(element.date);
                    //var utc = date.getTime();
                    //global.nedb.update({_id: element._id }, { $set: { recordedAt: utc}});//})

                    //console.log(element);
               });
               console.log("processed " + count + " of " + docs.length);
          });
}


pushMessagesQueue.drain = function() {
     setTimeout(pushMessages, 60000);
};

function pushMessages() {
     global.nedb.find({}, function (err, docs) {
          console.log(docs.length + ' items to be pushed..');
          docs.forEach(function (element, index, array) {
               pushMessagesQueue.push(element);
          });
     });
}

function getHistory(sensorId, callback) {
     console.log('loading history for sensor: ' + sensorId);

     var searchDateObj = new Date();
     searchDateObj.setHours(searchDateObj.getHours() - 24);
     global.nedb
          .find({
                    sensorId: sensorId,
                    timestamp_unix: { $gt: searchDateObj.getTime() }
          })
          .sort({ timestamp_unix: -1})
          .exec(function (err, docs) {
               console.log('found ' + docs.length + ' matching docs');

               var reducedDocs = [];
               var count = 0;
               var redval = 0;
               var lastItemHour = null;
               var lastItemMinute = 0;
               var lastItemCount = 0;
               var aggregateValSum = null;
               var itemCount = 0;
               docs.reverse().forEach(function (element, index, array) {
                    var itemDateTime = new Date(element.timestamp_unix);
                    var itemHour = itemDateTime.getHours();
                    var itemMinute = itemDateTime.getMinutes();
                    var itemSecond = itemDateTime.getSeconds();

                    if (lastItemMinute == 0)
                         lastItemMinute = itemMinute;

                    aggregateValSum += element.value;

                    if (itemMinute > lastItemMinute || index == docs.length - 1) {
                         var average = aggregateValSum / itemCount;
                         average = Math.round(average);

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

                    lastItemMinute = itemMinute;
               });

               console.log('reduced to ' + reducedDocs.length + ' documents');
               global.result[sensorId] = reducedDocs;
               callback();
          });


               //var dataHistorySql = "select convert(varchar, datepart(year, recordedat)) + '-' + \
     //          convert(varchar, datepart(month, recordedat)) + '-' + \
     //          convert(varchar, datepart(day, recordedat)) + ' ' + \
     //          convert(varchar, datepart(hour, recordedat)) + ':' + \
     //          convert(varchar, datepart(minute, recordedat)) as timestamp,\
     //          convert(int, datepart(year, recordedat)) as year, \
     //          convert(int, datepart(month, recordedat)) as month, \
     //          convert(int, datepart(day, recordedat)) as day, \
     //          convert(int, datepart(hour, recordedat)) as hour, \
     //          convert(int, datepart(minute, recordedat)) as minute, \
     //          convert(int, Round(avg(value), 0)) as 'Value' from sensors_data \
     //     where recordedat > DateADD(hour, -6, GETUTCDATE()) and sensorid='" + sensorId + "' \
     //     group by \
     //          datepart(year, recordedat), \
     //          datepart(month, recordedat), \
     //          datepart(day, recordedat), \
     //          datepart(hour, recordedat), \
     //          datepart(minute, recordedat) \
     //          order by year, month, day, hour, minute";
     //var connection = new global.sql.Connection(global.config, function (err) {
     //     console.log(err);
     //     var request = new global.sql.Request(connection);
     //     request.query(dataHistorySql, function (err, recordset) {
     //
     //          if (err) {
     //              console.log('query error on sensor: ' + sensorId);
     //              console.log(err);
     //          }
     //
     //          if (recordset && recordset.length > 0) {
     //               global.result[sensorId] = recordset;
     //
     //               }
     //          //else
     //               //callback(null, recordset);
     //
     //          callback();
     //
     //          connection.close();
     //     });
     //});
}

var q = global.async.queue(function (task, callback) {
     getHistory(task.sensorId, callback);
}, 1);

function loadHistory() {
     q.push({sensorId: 'outback_watts'});
     q.push({sensorId: 'outback_sys_batt_v'});
     q.push({sensorId: 'outback_gen_charge_watts'});
     q.push({sensorId: 'outback_pv_watts'});
     q.push({sensorId: 'outback_sys_soc'});
}

function pollMate3(recordData) {
     global.needle.get(global.config.outbackUrl, function (error, response) {
          if (error) {
               global.result.outback_data = { 'status': 'error trying to get data from the mate3' };
               return;
          }

          if (response.body && response.body.devstatus && response.body.devstatus.ports && response.body.devstatus.ports.length > 2) {
               global.result.outback_data = response.body;

              var charge_watts = null;
              var consumption_watts = null;
               response.body.devstatus.ports.forEach(function (device, key, array) {
                   if (device.Dev == 'FXR') {
                       var inv = device;
                       consumption_watts += (inv.Inv_I_L2 * inv.VAC_out_L2) + ((inv.Buy_I_L2 * inv.VAC_out_L2) - (inv.Chg_I_L2 * inv.VAC1_in_L2));
                       charge_watts += inv.Chg_I_L2 * inv.VAC1_in_L2;
                   }
                   if (device.Dev == 'CC')
                   {
                       var cc = device;
                       if (typeof cc !== 'undefined' && typeof cc.Out_I !== 'undefined' && typeof cc.Batt_V !== 'undefined') {
                           var a = cc.Out_I * cc.Batt_V;
                           global.result.outback_data.pv_in = Math.round(a / 10) * 10;
                       }
                   }
                   if (device.Dev == 'FNDC') {
                        global.result.outback_data.soc = device.SOC;
                   }
               });

               global.result.outback_data.inv_in = charge_watts;
               global.result.outback_data.inv_out = consumption_watts;

               if (recordData)
                    logData();
          } else {
               global.result.outback_data = { 'status': 'error reading the response from the mate3' };
          }
     });
}

function logData() {
     LogDataPoint('outback_pv_watts', global.result.outback_data.pv_in);
     LogDataPoint('outback_watts', global.result.outback_data.inv_out);
     LogDataPoint('outback_gen_charge_watts', global.result.outback_data.inv_in);
     LogDataPoint('outback_sys_batt_v', global.result.outback_data.devstatus.Sys_Batt_V);
     LogDataPoint('outback_sys_soc', global.result.outback_data.soc);
}

function LogDataPoint(sensorId, sensorValue) {
     if (!sensorValue) {
          //console.log('can not log.. no value passed for sensor ' + sensorId);
          return;
     }

     var recordDateTime = new Date();
     var doc = {
          sensorId: sensorId,
          value: sensorValue,
          timestamp_unix: recordDateTime.getTime(),
          timestamp: recordDateTime
     };
     global.nedb.insert(doc, function (err, newDoc) {
          // newDoc is the newly inserted document, including its _id
     });
}

setInterval(function() { pollMate3(true) }, 1000);
//setInterval(function() { pollMate3(true) }, 60000);

setInterval(function() { loadHistory() }, 15000);
loadHistory();

if (fs.existsSync('./extras/index.js')) {
     $extra = require('./extras/index.js');
     $extra.load(global);
}