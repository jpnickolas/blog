var express = require('express');
var app = express();

var mongoose=require('mongoose');
var passport=require('passport');
var LocalStrategy = require('passport-local').Strategy;
var fs = require('fs');

//the two servers that will be running in parallel
var http = require('http');
var https = require('https');

//gets the ssl credentials
var options = {
  key: fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/cert.pem')
}

mongoose.connect('mongodb://127.0.0.1/blog');

//initialization of express app
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
  
  //handles the fact that I've thrown static urls out the window. 
  app.all('/page/*', function(req, res, next) {
    //Redirect the url provided to index.html, and lets angular deal with it
    res.sendfile('index.html', { root: __dirname+'/public/'});
  });
});


//creates an article type for the database
var Article = mongoose.model('Article', {
  title: String,
  url: String,
  content: String,
  summary: String,
  published: Date,
  draft: Boolean
});

//creates a user type for the database and passport to use
var User = mongoose.model('User', {
  name: String,
  username: String,
  password: String
});

//Creates a simple username/password login system
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

/*
 * nice helper function to tell if a user is logged in when given a user
 *
 * user: String - the id of the user. Should be received from req.user in
 * the http request
 * return: boolean - true if the user is valid, and false if not
 */
function loggedIn(user, callback) {
  if(!user) 
    callback(false)
  
  else {
    User.findOne({_id:user}, function(err, found) {
      if(err) 
        callback(false);

      else if(!found)
        callback(false);
    
      else
        callback(true);
    });
  }
}

//serializes the user to be stored in a cookie (done using mongoDB _id, so
//I don't really have to obscure the data all that much
passport.serializeUser( function(user, done) {
  done(null, user._id);
});

//deserializes the user by looking them up by id
passport.deserializeUser(function(id, done) {
  User.findOne({_id:id}, function(err, user) {
    done(err, user);
  });
});

//controls login redirection
app.post('/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/#/login'
  })
);

//returns a list of the articles in json
app.get('/api/articles', function(req, res) {
  loggedIn(req.user, function(authenticated) {
    var criteria = {};
    
    //cannot view drafts unless logged in
    if(!authenticated)
      criteria.draft=false;

    //finds all the articles that fit the criteria
    Article.find(criteria,function(err, articles) {
      if(err) 
        res.send(err);
      
      res.json(articles);
    });
  });
});

//returns a specific article based on a url stored in the database
app.get('/api/articles/:article_url', function(req, res) {
  loggedIn(req.user, function(authenticated) {
    
    //sets the criteria to search by url
    var criteria = {};
    criteria.url=req.params.article_url;

    //cannot view drafts unless logged in
    if(!authenticated)
      criteria.draft=false;
      
    Article.find(criteria, function(err, article) {  
      if(err)
        res.send(err);

      res.json(article);
    });
  });
});

//edits an article based on the id provided, or creates a new article
app.post('/api/articles/:article_id', function(req, res) {
  loggedIn(req.user, function(authenticated) {
    if(!authenticated) {
      res.json(false);
      return;
    }
  
    var data = req.body;
  
    //checks if the article is currently in the database
    Article.findOne({_id:req.params.article_id}, function(err, found) {

      //if it is, it edits the article, rather than creating a new one
      if(found) {
        found.title=data.title;
        found.url=data.url;
        found.content=data.content;
        found.summary=data.summary;
        found.draft = data.draft;
        found.save(); 
        res.json(found);
      }

      //creates a new article if one is not already in the database
      else {
        Article.create({
          title:data.title,
          url:data.url,
          content: data.content,
          summary: data.summary,
          published: data.date,
          draft: data.draft
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
});

//deletes an article based its id
app.delete('/api/articles/:article_id', function(req, res) {
  loggedIn(req.user, function(authenticated) {
    if(!authenticated) { 
      res.json(false);
      return;
    }
  
    //removes the article from the database   
    Article.remove( {
      _id: req.params.article_id
    }, function(err, article) {
      if(err)
        res.send(err);
    
      //writes out all of the articles currently in the database.
      Article.find(function(err, articles) {
        if(err)
          res.send(err);
      
        res.json(articles);
      });
    
    });
  });
});

//checks if the user is logged in
app.get('/api/loggedIn', function(req, res) {
  loggedIn(req.user, function(authenticated) {
    res.json(authenticated);
  });
});

//starts both servers to be identical to offer a secure option
http.createServer(app).listen(80);

https.createServer(options, app).listen(443);
