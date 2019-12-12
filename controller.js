var bodyParser = require("body-parser");
var fs = require('fs');
var urlencode = bodyParser.urlencoded({extended: false});

module.exports = function(app) {

  app.get("/", function(req, res) {
    res.render("index");
  });
  
  // app.get("/share/:type", function(req, res) {
  //   res.render("outcomes", {type:req.params.type});
  // });

};
