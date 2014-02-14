var express = require('express');
var app = express();
var mongoose=require('mongoose');
var passport=require('passport');
var LocalStrategy = require('passport-local').Strategy;

mongoose.connect('mongodb://nickhilton.net/blog');

app.configure(function() {
  app.use(express.static(__dirname+'/public/'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());

  //required for passport authentication
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'secret', maxAge:5*60*1000 }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});

var Article = mongoose.model('Article', {
  title: String,
  content: String,
  summary: String,
  published: Date
});

var User = mongoose.model('User', {
  name: String,
  username: String,
  password: String
});

passport.use(new LocalStrategy( {
  usernameField: 'user',
  passwordField: 'passwd'
  },
  function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if(err) 
        return done(err);
      if(!user) 
        return done(null, false, { message: 'Incorrect username.' });
      if(user.password === password)
        return done(null, user);
      else
        return done(null, false, { message: 'Incorrect password.' });
    });
  })
);


passport.serializeUser( function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});

app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '#/login'
  })
);

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

app.post('/api/articles/:article_id', function(req, res) {
  var data = req.body;
  Article.findOne({_id:req.params.article_id}, function(err, found) {
    if(found) {
      found.title=data.title;
      found.content=data.content;
      found.summary=data.summary;
      found.published=data.published;
      found.save(); 
      res.json(found);
    }
    else {
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
    }
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

app.listen(80);
