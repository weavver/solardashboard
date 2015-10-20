
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

global.express.static.mime.define({ 'text/css': ['css'] });

global.app.use(global.express.static('public'));
global.app.use('/bower_components', global.express.static('bower_components'));

// respond with "Hello World!" on the homepage
//global.app.get('/', function (req, res) {
//     res.send('Hello World!');
//});

var server = global.app.listen(80, function () {
     var host = server.address().address;
     var port = server.address().port;

     console.log('Example app listening at http://%s:%s', host, port);
});

var outbackData = {};

global.app.engine('tpl', function (filePath, options, callback) { // define the template engine
     fs.readFile(filePath, function (err, content) {
          if (err) return callback(new Error(err));
          // this is an extremely simple template engine
          var rendered = content.toString().replace('#title#', '<title>' + options.title + '</title>')
          .replace('#extra_scripts#', options.extra_scripts);
          return callback(null, rendered);
     })
});
global.app.set('views', './views'); // specify the views directory
global.app.set('view engine', 'tpl'); // register the template engine

global.app.get('/', function (req, res) {
     res.render('index', global.tpl_data);
})

// respond with "Hello World!" on the homepage
global.app.get('/data', function (req, res) {
    global.async.parallel([
        function (callback) {
             getHistory(callback, 'outback_watts');
        },
         function (callback) {
              getHistory(callback, 'outback_sys_batt_v');
         },
         function (callback) {
              getHistory(callback, 'outback_gen_charge_watts');
         },
         function (callback) {
              getHistory(callback, 'outback_pv_watts');
         },
         function (callback) {
              getHistory(callback, 'outback_sys_soc');
         }],
        function (err, results) {
            if (err) {
		     console.log(err);
		     res.send({'status': 'fail', 'err': err});
            }
            global.result.data_watts = results[0];
            global.result.data_voltage = results[1];
            global.result.data_generator = results[2];
            global.result.data_solar = results[3];
            global.result.data_soc = results[4];
            res.send(global.result);
        });
});

function LogDataPoint(sensorId, val) {
     if (!val)
          return;

     var connection = new global.sql.Connection(global.config, function (err) {
          var request = new global.sql.Request(connection); // or: var request = connection.request();
          request.input('orgId', global.sql.VarChar, global.config.orgId);
          request.input('sensorId', global.sql.VarChar, sensorId);
          request.input('val', global.sql.VarChar, val);

		var sql2 = "BEGIN \
		  	--	   IF NOT EXISTS (SELECT top 1 * FROM Sensors_Data where RecordedAt > DateADD(s, -1, GETUTCDATE()) and SensorId=@sensorId) \
			--	   BEGIN \
				       	insert into Sensors_Data (id, organizationid, sensorid, value, recordedat) values(newid(), @orgId, @sensorId, @val, GETUTCDATE()) \
					select 'inserted' \
			--	   END \
		   	    END";

          sql2 = "BEGIN \
                    insert into Sensors_Data (id, organizationid, sensorid, value, recordedat) values(newid(), @orgId, @sensorId, @val, GETUTCDATE()) \
                    select 'inserted' \
               END";

          request.batch(sql2, function (err, recordset) {
               if (err) {
                    console.log(err);
               } else if (recordset && recordset.length > 0) {
                    // console.log('Recorded sensor ' + sensorId + ' value ' + val);
               }
          });
     });
}

function getHistory(callback, sensorId) {
     var dataHistorySql = "select convert(varchar, datepart(year, recordedat)) + '-' + \
               convert(varchar, datepart(month, recordedat)) + '-' + \
               convert(varchar, datepart(day, recordedat)) + ' ' + \
               convert(varchar, datepart(hour, recordedat)) + ':' + \
               convert(varchar, datepart(minute, recordedat)) as timestamp,\
               convert(int, datepart(year, recordedat)) as year, \
               convert(int, datepart(month, recordedat)) as month, \
               convert(int, datepart(day, recordedat)) as day, \
               convert(int, datepart(hour, recordedat)) as hour, \
               convert(int, datepart(minute, recordedat)) as minute, \
               convert(int, Round(avg(value), 0)) as 'Value' from sensors_data \
          where recordedat > DateADD(hour, -6, GETUTCDATE()) and sensorid='" + sensorId + "' \
          group by \
               datepart(year, recordedat), \
               datepart(month, recordedat), \
               datepart(day, recordedat), \
               datepart(hour, recordedat), \
               datepart(minute, recordedat) \
               order by year, month, day, hour, minute";
     var connection = new global.sql.Connection(global.config, function (err) {
          var request = new global.sql.Request(connection);
          request.query(dataHistorySql, function (err, recordset) {
               if (err)
                    console.log(err);

               if (recordset && recordset.length > 0)
                    callback(null, recordset);
               else
                    callback(null, recordset);
          });
     });
}

function logData() {
     global.needle.get(global.config.outbackUrl, function (error, response) {
          if (error) {
               global.result.outback_data = { 'status': 'error trying to get data from the mate3' };
               return;
          }

          if (response.body && response.body.devstatus && response.body.devstatus.ports && response.body.devstatus.ports.length > 2) {
               global.result.outback_data = response.body;

               var inv = response.body.devstatus.ports[0];
               //var consumption_watts = (inv.Inv_I * inv.VAC_out) + ((inv.Buy_I * inv.VAC_out) - (inv.Chg_I * inv.VAC_in));
               var consumption_watts = (inv.Inv_I_L2 * inv.VAC_out_L2) + ((inv.Buy_I_L2 * inv.VAC_out_L2) - (inv.Chg_I_L2 * inv.VAC1_in_L2));
               LogDataPoint('outback_watts', consumption_watts);

               var cc = response.body.devstatus.ports[1];
               if (typeof cc !== 'undefined' && typeof cc.Out_I !== 'undefined' && typeof cc.Batt_V !== 'undefined') {
                    var a = cc.Out_I * cc.Batt_V;
                    global.result.outback_data.pv_in = Math.round(a / 10) * 10;
                    LogDataPoint('outback_pv_watts', global.result.outback_data.pv_in);
               }

               global.result.outback_data.inv_in = inv.Chg_I_L2 * inv.VAC1_in_L2;
               global.result.outback_data.inv_out = consumption_watts;

               LogDataPoint('outback_gen_charge_watts', global.result.outback_data.inv_in);
               LogDataPoint('outback_sys_batt_v', response.body.devstatus.Sys_Batt_V);
               LogDataPoint('outback_sys_soc', response.body.devstatus.ports[2].SOC);
          } else {
               global.result.outback_data = { 'status': 'error reading the response from the mate3' };
          }
     });
}

setInterval(logData, 1000);

if (fs.existsSync('./extras/index.js')) {
     $extra = require('./extras/index.js');
     $extra.load(global);
}
