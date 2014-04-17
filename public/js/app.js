angular.module('blog', ['ngRoute','ngAnimate','ngSanitize'])

//some nice factory functions 
.factory('Articles', function($http) {
  var factory = {};

  //gets the articles from the server
  factory.getArticles = function(){
    return $http.get('/api/articles');
  };

  //gets a specific article from the server
  factory.getArticle = function(id) {
    return $http.get('/api/articles/'+id);
  };

  //saves an article to the server
  factory.saveArticle = function(article) {
    return $http.post('/api/articles/'+article._id, {
      title:article.title,
      url:article.url,
      content:article.content,
      summary:article.summary,
      published:dateNow(),
      draft:article.draft
    });
  };

  //deletes an article from the server
  factory.deleteArticle = function(id) {
    return $http.delete('/api/articles/'+id);
  };

  factory.loggedIn = function() {
    return $http.get('/api/loggedin');
  };

  return factory;
})


//Controls the layout of the url in the site
.config(function($routeProvider, $locationProvider) {
  
  if(window.history && window.history.pushState){
    $locationProvider.html5Mode(true);
  }

  $routeProvider
    .when('/', {
      controller:'ListCtrl',
      templateUrl:'list.html'
    })
    .when('/page/post/:post_id', {
      controller: 'ViewPostCtrl',
      templateUrl: 'view.html'
    })
    .when('/page/new/post', {
      controller: 'NewPostCtrl',
      templateUrl: 'edit.html'
    })
    .when('/page/post/edit/:post_id', {
      controller:'EditPostCtrl',
      templateUrl:'edit.html'
    })
    .when('/page/login', {
      templateUrl:'login.html'
    })
    .when('/page/about', {
      templateUrl:'about.html'
    })
    .otherwise({
      redirectTo:'/'
    });
})

//A nice little filter that will tell angular to trust the html instead of
//using the html as text
.filter('trustHTML', function($sce) {
  return function(val) {
    return $sce.trustAsHtml(val);
  };
})

//controller for listing the articles. Pretty simple
.controller('ListCtrl', function($scope, Articles) {
  
  $scope.loggedIn=false;

  Articles.getArticles().success(function(data) {
    $scope.articles = data;
  });
  
  Articles.loggedIn().success(function(data) {
    $scope.loggedIn=data;
  });
})

//assigns the save function for creating new posts
.controller('NewPostCtrl', function($scope, $routeParams, $location, Articles) {
  $scope.article={};
  
  $scope.save = function() {
    Articles.saveArticle($scope.article);
    $location.path('#/');
  };

})

//assigns the save and edit functions for editing posts
.controller('EditPostCtrl', function($scope, $routeParams, $location, Articles) {
 
  $scope.article = {};
  
  Articles.getArticle($routeParams.post_id).success(function(data) {
    $scope.article=data[0];
  });
  $scope.save = function() {
    Articles.saveArticle($scope.article);
    $location.path('#/');
  };

  $scope.delete = function() {
    Articles.deleteArticle($scope.article._id);
    $location.path('#/');
  };
  
  // initialisation
  /*editAreaLoader.init({
    id: "editor" // id of the textarea to transform    
    ,start_highlight: true  // if start with highlight
    ,toolbar: "syntax_selection"
    ,allow_resize: "both"
    ,allow_toggle: true
    ,word_wrap: true
    ,language: "en"
    ,change_callback: "updateEditor"
    ,syntax: "html"  
  });*/
})

//Very basic, just gets the article requested, and sends it to the page
.controller('ViewPostCtrl', function($scope, $routeParams, $location, Articles) {
  $scope.article = false;
  $scope.loggedIn = false;
  $scope.notFound = false;

  Articles.getArticle($routeParams.post_id).success(function(data) {
    if(data[0])
      $scope.article=data[0];
    else
      $scope.notFound=true   
  });

  Articles.loggedIn().success(function(data) {
    $scope.loggedIn=data;
  });
});

//nice helper function for getting the date
function dateNow() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!

  var yyyy = today.getFullYear();
  if(dd<10){dd='0'+dd;} if(mm<10){mm='0'+mm;} today = mm+'/'+dd+'/'+yyyy;
  return today;
}

/*function updateEditor(id) {
  var editor = document.getElementById(id);
  editor.value=editAreaLoader.getValue(id);
  $('#'+id).change();
}*/
