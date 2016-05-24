
exports.init = function (global) {
     global.data.boot_date = new Date();
     global.app.get('/data', function (req, res) {
          res.send(global.data);
     });
};
