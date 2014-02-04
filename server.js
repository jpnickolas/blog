var express = require('express');
var app = express();
var mongoose=require('mongoose');

mongoose.connect('mongodb://0.0.0.0/blog');

app.configure(function() {
  app.use(express.static(__dirname+'/public/'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
});

var Article = mongoose.model('Article', {
  title: String,
  content: String,
  summary: String,
  published: Date
});

/*
app.get('/api/articles', function(req, res) {
  Article.find(
  );
});*/

app.listen(8080);
