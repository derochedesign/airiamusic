module.exports = function(app) {

  app.get("/", function(req, res) {
    res.render("index");
  });
  app.get("/engine", function(req, res) {
    res.render("ai-test");
  });
  
  // app.get("/share/:type", function(req, res) {
  //   res.render("outcomes", {type:req.params.type});
  // });

};
