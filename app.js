

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

global.data = {};
global.data_history = {};
global.tpl_data = { extra_scripts: '' };
global.config = require('./config');
global.async = require('async');
global.sql = require('mssql');
global.express = require('express');
global.app = global.express();
global.needle = require('needle');
global.jsdom = require("jsdom");
global.nedbDatastore = require('nedb');
global.path = require('path');
global.MongoClient = require('mongodb').MongoClient;

global.express.static.mime.define({ 'text/css': ['css'] });
var basicAuth = require('basic-auth-connect');
global.outback = require('./vendors/outback.js').init(global);

global.app.use(global.express.static('public'),basicAuth('user1', 'pass1'));
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

global.api_data = require('./api/data_get.js').init(global);
//global.api_history = require('./api/history_get.js').init(global);

if (fs.existsSync('./extras/index.js')) {
     $extra = require('./extras/index.js');
     $extra.load(global);
}
