
exports.init = function (global) {
     global.data.boot_date = new Date();
     global.app.get('/data', function (req, res) {
          res.send(global.data);
     });

     global.app.get('/test', function (req, res) {
          console.log(req.query);
          res.send({message: 'OK'});
     });
};
