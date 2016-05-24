

// file not in use for the moment
var pushMessagesQueue = global.async.queue(function (task, callback) {

});


//function loadHistory() {
//     console.log(new Date().getTime());
//
//     var count = 0;
//     var d2 = new Date();
//     console.log(d2.getTime());
//
//     //("2015/11/12");
//     d2.setHours(d2.getHours() - 6);
//     console.log(d2.getTime());
//}


//pushMessagesQueue.drain = function() {
//     setTimeout(pushMessages, 60000);
//};

//var q = global.async.queue(function (task, callback) {
//     getHistory(task, callback);
//}, 1);

//function loadHistory() {
//     q.push({sensorId: 'outback_watts', precision: 0});
//     q.push({sensorId: 'outback_sys_batt_v', precision: 1});
//     q.push({sensorId: 'outback_gen_charge_watts', precision: 0});
//     q.push({sensorId: 'outback_pv_watts', precision: 0});
//     q.push({sensorId: 'outback_sys_soc', precision: 0});
//     q.push({sensorId: 'outback_kwh_in', precision: 2});
//     q.push({sensorId: 'outback_kwh_out', precision: 2});
//     q.push({sensorId: 'outback_kwh_net', precision: 2});
//}

global.logQueue = [];

function LogDataPoint() {
     global.MongoClient.connect(global.config.mongo_url, function(err, db) {
          if (err) {
               console.log(err);
               return;
          }

          var sensordata = db.collection('sensordata');
          sensordata.insertMany([ doc ], function(err, result) {
               if (err) {
                    console.log('err inserting data: ' + err);
               }
               db.close();
          });
     });
}