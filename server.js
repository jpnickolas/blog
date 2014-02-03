var express = require('express');
var app = express();
var mongoose=require('mongoose');

mongoose.connect('mongodb://0.0.0.0/blog');

app.configure(function() {
  app.use(express.static(__dirname+'/public/'));
  app.use(express.bodyParser());
});

app.listen(8080);
