var express = require("express");
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
var server  = require('http').createServer(app);

server.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started");
});
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("experiment");
});
