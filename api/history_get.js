

exports.init = function (global) {
     global.app.get('/data_history', function (req, res) {
          res.send(global.data_history);
     });
};