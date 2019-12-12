module.exports = function(app) {

  app.get("/", function(req, res) {
    res.render("index");
  });
  
  // app.get("/share/:type", function(req, res) {
  //   res.render("outcomes", {type:req.params.type});
  // });

};
