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

app.get('/api/articles', function(req, res) {
  Article.find(function(err, articles) {
    if(err) 
      res.send(err);
      
    res.json(articles);
  });
});

app.get('/api/articles/:article_id', function(req, res) {
  Article.find({_id:req.params.article_id}, function(err, article) {
    if(err)
      res.send(err);

    res.json(article);
  });
});

app.post('/api/articles', function(req, res) {
  var data = req.body;
  Article.create({
    title:data.title,
    content: data.content,
    summary: data.summary,
    published: data.date
  }, function(err, article) {
    if(err)
      res.send(err);
      
      Article.find(function(err, articles) {
        if(err)
          res.send(err);
        
        res.json(articles);
      });
  });
});
app.delete('/api/articles/:article_id', function(req, res) {
  Article.remove( {
    _id: req.params.article_id
  }, function(err, article) {
    if(err)
      res.send(err);
    
    Article.find(function(err, articles) {
      if(err)
        res.send(err);
      
      res.json(articles);
    });
    
  });
});

app.listen(8080);
