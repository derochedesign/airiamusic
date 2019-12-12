const express = require('express');
const controller = require("./controller");
const port = 3041;

const app = express();

app.set("view engine", "ejs");

app.use(express.static("./public"));

controller(app);

app.listen(process.env.PORT || port);
console.log(`listening on ${port}`);
